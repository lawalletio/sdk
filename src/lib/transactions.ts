import {
  NDKEvent,
  NDKFilter,
  NDKKind,
  NDKRelaySet,
  NDKSigner,
  NDKSubscription,
  NDKTag,
  NostrEvent,
} from '@nostr-dev-kit/ndk';
import { Federation } from '../class/Federation.js';
import { Wallet } from '../class/Wallet.js';
import { LaWalletKinds, LaWalletTags } from '../constants/nostr.js';
import { errorTags, startTags, statusTags, successTags } from '../constants/tags.js';
import { ModulePubkeysConfigType } from '../types/Federation.js';
import {
  ExecuteTransactionParams,
  InvoiceTransferType,
  LNURLTransferType,
  Transaction,
  TransactionDirection,
  TransactionParams,
  TransactionStatus,
  TransactionType,
  TransferTypes,
} from '../types/Transaction.js';
import { Api } from './api.js';
import { lnurl_decode } from './lnurl.js';
import {
  getMultipleTagsValues,
  getTagValue,
  normalizeLightningDomain,
  nowInSeconds,
  parseContent,
  validateEmail,
} from './utils.js';
import { extendedEncrypt } from './nip04.js';
import { checkRelaysConnection, killRelaysConnection } from './ndk.js';

type EventWithStatus = {
  startEvent: NDKEvent | undefined;
  statusEvent: NDKEvent | undefined;
};

const defaultInvoiceTransfer: InvoiceTransferType = {
  data: '',
  amount: 0,
  type: TransferTypes.NONE,
  expired: false,
};

const defaultLNURLTransfer: LNURLTransferType = {
  data: '',
  amount: 0,
  type: TransferTypes.NONE,
  lnurlpData: null,
};

export function transactionsFilters(
  pubkey: string,
  modulePubkeys: ModulePubkeysConfigType,
  filters: Partial<NDKFilter>,
) {
  return [
    {
      authors: [pubkey],
      kinds: [LaWalletKinds.REGULAR as unknown as NDKKind],
      '#t': [LaWalletTags.INTERNAL_TRANSACTION_START],
      ...filters,
    },
    {
      '#p': [pubkey],
      '#t': startTags,
      kinds: [LaWalletKinds.REGULAR as unknown as NDKKind],
      ...filters,
    },
    {
      authors: [modulePubkeys.ledger],
      kinds: [LaWalletKinds.REGULAR as unknown as NDKKind],
      '#p': [pubkey],
      '#t': statusTags,
      ...filters,
    },
  ];
}

function findAsocciatedEvent(events: NDKEvent[], eventId: string) {
  return events.find((event) => {
    const associatedEvents: string[] = getMultipleTagsValues(event.tags, 'e');
    return associatedEvents.includes(eventId) ? event : undefined;
  });
}

function filterEventsByTxType(events: NDKEvent[]) {
  const startedEvents: NDKEvent[] = [],
    statusEvents: NDKEvent[] = [],
    refundEvents: NDKEvent[] = [];

  events.forEach((e) => {
    const subkind: string | undefined = getTagValue(e.tags, 't');
    if (subkind) {
      const isStatusEvent: boolean = statusTags.includes(subkind);

      if (isStatusEvent) {
        statusEvents.push(e);
        return;
      } else {
        const eTags: string[] = getMultipleTagsValues(e.tags, 'e');

        if (eTags.length) {
          const isRefundEvent = events.find((event) => eTags.includes(event.id));
          isRefundEvent ? refundEvents.push(e) : startedEvents.push(e);
          return;
        } else {
          const existTransaction: boolean = Boolean(startedEvents.find((startEvent) => startEvent.id === e.id));

          if (!existTransaction) startedEvents.push(e);
          return;
        }
      }
    }
  });

  return [startedEvents, statusEvents, refundEvents];
}

function parseStatusEvents(
  startEvent: NDKEvent,
  statusEvents?: NDKEvent[],
  refundEvents?: NDKEvent[],
): EventWithStatus[] {
  const statusEvent: NDKEvent | undefined = statusEvents
    ? findAsocciatedEvent(statusEvents, startEvent.id!)
    : undefined;

  const startRefundEvent: NDKEvent | undefined = refundEvents
    ? findAsocciatedEvent(refundEvents, startEvent.id!)
    : undefined;

  const statusRefundEvent: NDKEvent | undefined =
    startRefundEvent && refundEvents ? findAsocciatedEvent(refundEvents, startRefundEvent.id!) : undefined;

  const startWithStatus: EventWithStatus = {
    startEvent,
    statusEvent,
  };

  const refundWithStatus: EventWithStatus = {
    startEvent: startRefundEvent,
    statusEvent: statusRefundEvent,
  };

  return [startWithStatus, refundWithStatus];
}

async function formatStartTransaction(wallet: Wallet, event: NDKEvent) {
  const nostrEvent: NostrEvent = await event.toNostrEvent();
  const AuthorIsCard: boolean = event.pubkey === wallet.federation.modulePubkeys.card;

  //   const DelegatorIsUser: boolean = AuthorIsCard && nip26.getDelegator(nostrEvent as Event) === pubkey;
  const AuthorIsUser: boolean = event.pubkey === wallet.pubkey;

  if (AuthorIsCard) {
    const delegation_pTags: string[] = getMultipleTagsValues(event.tags, 'p');
    if (!delegation_pTags.includes(wallet.pubkey)) return;
  }

  const direction = AuthorIsUser ? TransactionDirection.OUTGOING : TransactionDirection.INCOMING;

  const eventContent = parseContent(event.content);
  // TO-DO exctract metadata with signer
  // const metadata = await extractMetadata(nostrEvent, direction);

  let newTransaction: Transaction = {
    id: event.id!,
    status: TransactionStatus.PENDING,
    memo: eventContent.memo ?? '',
    direction,
    type: AuthorIsCard ? TransactionType.CARD : TransactionType.INTERNAL,
    tokens: eventContent.tokens,
    events: [nostrEvent],
    errors: [],
    createdAt: event.created_at! * 1000,
    metadata: {},
  };

  if (!AuthorIsCard) {
    const boltTag: string | undefined = getTagValue(event.tags, 'bolt11');
    if (boltTag && boltTag.length) newTransaction.type = TransactionType.LN;
  }

  return newTransaction;
}

async function updateTxStatus(transaction: Transaction, statusEvent: NDKEvent) {
  const parsedContent = parseContent(statusEvent.content);

  const statusTag: string | undefined = getTagValue(statusEvent.tags, 't');

  if (statusTag) {
    const isError: boolean = statusTag.includes('error');

    if (transaction.direction === TransactionDirection.INCOMING && statusTag.includes('inbound'))
      transaction.type = TransactionType.LN;

    transaction.status = isError ? TransactionStatus.ERROR : TransactionStatus.CONFIRMED;

    if (isError) transaction.errors = [parsedContent];
    transaction.events.push(await statusEvent.toNostrEvent());
  }

  return transaction;
}

async function markTxRefund(transaction: Transaction, statusEvent: NDKEvent) {
  const parsedContent = parseContent(statusEvent.content);
  transaction.status = TransactionStatus.REVERTED;
  transaction.errors = [parsedContent?.memo];
  transaction.events.push(await statusEvent.toNostrEvent());

  return transaction;
}

async function fillTransaction(wallet: Wallet, txEvents: EventWithStatus, refundEvents: EventWithStatus) {
  let tmpTransaction: Transaction | undefined = await formatStartTransaction(wallet, txEvents.startEvent!);
  if (!tmpTransaction) return;

  if (txEvents.statusEvent) tmpTransaction = await updateTxStatus(tmpTransaction, txEvents.statusEvent);

  if (refundEvents.startEvent)
    tmpTransaction = await markTxRefund(tmpTransaction, refundEvents.statusEvent || refundEvents.startEvent);

  return tmpTransaction;
}

export async function parseTransactionsEvents(wallet: Wallet, events: NDKEvent[]) {
  const transactions: Transaction[] = [];
  const [startedEvents, statusEvents, refundEvents] = filterEventsByTxType(events);

  await Promise.all(
    startedEvents!.map(async (startEvent) => {
      const [startWithStatus, refundWithStatus] = parseStatusEvents(startEvent, statusEvents, refundEvents);
      const transaction = await fillTransaction(wallet, startWithStatus!, refundWithStatus!);

      if (transaction) transactions.push(transaction);
    }),
  );

  return transactions;
}

export const detectTransferType = (data: string): TransferTypes => {
  if (!data.length) return TransferTypes.NONE;

  const upperStr: string = data.toUpperCase();
  const isLUD16 = validateEmail(upperStr);
  if (isLUD16) return TransferTypes.LUD16;

  if (upperStr.startsWith('LNURL')) return TransferTypes.LNURL;
  if (upperStr.startsWith('LNBC')) return TransferTypes.INVOICE;

  return TransferTypes.INTERNAL;
};

const removeHttpOrHttps = (str: string) => {
  if (str.startsWith('http://')) return str.replace('http://', '');
  if (str.startsWith('https://')) return str.replace('https://', '');

  return str;
};

const getLnUrlpData = async (callback: string) => {
  const api = Api();
  const response = await api.get(callback);

  return response;
};

const parseLNURLInfo = async (data: string, federation: Federation = new Federation()): Promise<LNURLTransferType> => {
  const decodedLNURL = lnurl_decode(data);

  const lnurlpData = await getLnUrlpData(decodedLNURL);
  if (!lnurlpData) return defaultLNURLTransfer;

  const transfer: LNURLTransferType = {
    ...defaultLNURLTransfer,
    data,
    type: TransferTypes.LNURL,
    lnurlpData,
  };

  if (lnurlpData.tag === 'withdrawRequest') {
    return {
      ...transfer,
      type: TransferTypes.LNURLW,
      amount: lnurlpData.maxWithdrawable! / 1000,
    };
  }

  const decodedWithoutHttps: string = removeHttpOrHttps(decodedLNURL).replace('www.', '');
  const [domain, username] = decodedWithoutHttps.includes('/.well-known/lnurlp/')
    ? decodedWithoutHttps.split('/.well-known/lnurlp/')
    : decodedWithoutHttps.split('/lnurlp/');

  if (lnurlpData && lnurlpData.tag === 'payRequest') {
    const amount: number = lnurlpData.minSendable! === lnurlpData.maxSendable! ? lnurlpData.maxSendable! / 1000 : 0;

    try {
      if (lnurlpData.federationId && lnurlpData.federationId === federation.id) {
        return {
          ...transfer,
          data: username && domain ? `${username}@${domain}` : data,
          type: TransferTypes.INTERNAL,
          amount,
        };
      } else {
        const parsedMetadata: Array<string>[] = JSON.parse(lnurlpData.metadata);
        const identifier: string[] | undefined = parsedMetadata.find((data: string[]) => {
          if (data[0] === 'text/identifier') return data;
        });

        if (identifier && identifier.length === 2) return { ...transfer, data: identifier[1]!, amount };
      }
    } catch (error) {
      console.log(error);
    }
  }

  return {
    ...transfer,
    data: username && domain ? `${username}@${domain}` : data,
  };
};

export const splitHandle = (handle: string, federation: Federation = new Federation()): string[] => {
  if (!handle.length) return [];

  try {
    if (handle.includes('@')) {
      const [username, domain] = handle.split('@');
      return [username!, domain!];
    } else {
      return [handle, normalizeLightningDomain(federation.lightningDomain)];
    }
  } catch {
    return [];
  }
};

const parseLUD16Info = async (data: string, federation: Federation = new Federation()): Promise<LNURLTransferType> => {
  const [username, domain] = splitHandle(data, federation);
  const federationDomain = normalizeLightningDomain(federation.lightningDomain);

  const lnurlpData =
    federationDomain === domain
      ? await federation.getLnUrlpData(username)
      : await getLnUrlpData(`https://${domain}/.well-known/lnurlp/${username}`);

  if (!lnurlpData) return defaultLNURLTransfer;

  const amount: number = lnurlpData.minSendable === lnurlpData.maxSendable ? lnurlpData.maxSendable! / 1000 : 0;

  const transfer: LNURLTransferType = {
    ...defaultLNURLTransfer,
    data,
    amount,
    type: TransferTypes.LUD16,
    lnurlpData,
  };

  if (lnurlpData.federationId && lnurlpData.federationId === federation.id) {
    return {
      ...transfer,
      type: TransferTypes.INTERNAL,
    };
  }

  return transfer;
};

export const removeLightningStandard = (str: string) => {
  const lowStr: string = str.toLowerCase();

  if (lowStr.startsWith('lightning://')) return lowStr.replace('lightning://', '');
  if (lowStr.startsWith('lightning:')) return lowStr.replace('lightning:', '');
  if (lowStr.startsWith('lnurlw://')) return lowStr.replace('lnurlw://', '');

  return lowStr;
};

export const formatLNURLData = async (
  data: string,
  federation: Federation = new Federation(),
): Promise<LNURLTransferType> => {
  if (!data.length) return defaultLNURLTransfer;
  const cleanStr: string = removeLightningStandard(data);

  const decodedTransferType: TransferTypes = detectTransferType(cleanStr);
  if (decodedTransferType === TransferTypes.NONE || decodedTransferType === TransferTypes.INVOICE)
    return defaultLNURLTransfer;

  switch (true) {
    case decodedTransferType === TransferTypes.LUD16 || decodedTransferType === TransferTypes.INTERNAL:
      return parseLUD16Info(cleanStr, federation);

    default:
      return parseLNURLInfo(cleanStr, federation);
  }
};

export const buildTxStartEvent = (props: TransactionParams, federation: Federation = new Federation()): NostrEvent => {
  const { tokenId, amount, senderPubkey, comment, tags = [] } = props;

  const txTags: NDKTag[] = [
    ['t', LaWalletTags.INTERNAL_TRANSACTION_START],
    ['p', federation.modulePubkeys.ledger],
    ...tags,
  ];

  return {
    pubkey: senderPubkey,
    kind: LaWalletKinds.REGULAR,
    content: JSON.stringify({
      tokens: { [tokenId]: amount.toString() },
      ...(comment ? { memo: comment } : {}),
    }),
    tags: txTags,
    created_at: nowInSeconds(),
  };
};

export const encryptMetadataTag = async (
  signer: NDKSigner,
  receiverPubkey: string,
  metadata: Record<string, string>,
): Promise<NDKTag> => {
  const metadataEncrypted: string = await extendedEncrypt(signer, receiverPubkey, JSON.stringify(metadata));

  const metadataTag: NDKTag = ['metadata', 'true', 'nip04', metadataEncrypted];
  return metadataTag;
};

export function receivedTransactionFilter(startEvent: NostrEvent, ledgerPubkey: string) {
  return {
    authors: [ledgerPubkey],
    kinds: [LaWalletKinds.REGULAR as unknown as NDKKind],
    '#e': startEvent?.id ? [startEvent.id] : [],
  };
}

export async function executeTransaction(params: ExecuteTransactionParams) {
  const { ndk, startEvent, federation, onSuccess, onError } = params;

  let published = await federation.httpPublish(startEvent);

  let relaysConnectedBeforeFetch: boolean = await checkRelaysConnection(ndk);

  return new Promise((resolve, reject) => {
    if (!published) reject('The transaction start event could not be published.');

    let filters = receivedTransactionFilter(startEvent, federation.modulePubkeys.ledger);

    setTimeout(() => {
      ndk
        .fetchEvents(filters, { closeOnEose: true }, NDKRelaySet.fromRelayUrls(federation.relaysList, ndk, true))
        .then(async (events) => {
          let statusEvent = Array.from(events).find((event) => {
            const tTag = event.getMatchingTags('t')[0][1];

            if (statusTags.includes(tTag)) return event;
          });

          if (statusEvent) {
            let nostrEvent = await statusEvent.toNostrEvent();
            let tTag = statusEvent.getMatchingTags('t')[0][1];

            if (successTags.includes(tTag) && onSuccess) onSuccess(nostrEvent);
            if (errorTags.includes(tTag) && onError) onError(nostrEvent.content);

            if (!relaysConnectedBeforeFetch) killRelaysConnection(ndk);

            resolve(nostrEvent);
          } else {
            if (onError) onError('Unexpected error');
            resolve(null);
          }
        })
        .catch(() => {
          if (onError) onError('Unexpected error');
          resolve(null);
        });
    }, 500);

    // const s = new NDKSubscription(
    //   ndk,
    //   filters,
    //   { closeOnEose: true },
    //   NDKRelaySet.fromRelayUrls(federation.relaysList, ndk, true),
    // );

    // const t2 = setTimeout(() => {
    //   s.stop();
    //   if (onError) onError('Unexpected error');
    //   if (!relaysConnectedBeforeFetch) killRelaysConnection(ndk);
    //   resolve(null);
    // }, 10000);

    // s.on('event', async (event: NDKEvent) => {
    //   let nostrEvent = await event.toNostrEvent();

    //   let tTag = event.getMatchingTags('t')[0][1];
    //   if (tTag) {
    //     if (successTags.includes(tTag) && onSuccess) onSuccess(nostrEvent);
    //     if (errorTags.includes(tTag) && onError) onError(nostrEvent.content);
    //   }

    //   if (!relaysConnectedBeforeFetch) killRelaysConnection(ndk);
    //   resolve(event);
    // });

    // s.on('eose', () => {
    //   clearTimeout(t2);

    //   if (!relaysConnectedBeforeFetch) killRelaysConnection(ndk);
    //   resolve(null);
    // });

    // s.start();
  });
}
