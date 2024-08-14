import { NDKEvent, NostrEvent } from '@nostr-dev-kit/ndk';
import { statusTags } from '../constants/tags';
import { getMultipleTagsValues, getTagValue, parseContent } from './utils';
import { Transaction, TransactionDirection, TransactionStatus, TransactionType } from '../types/Transaction';
import { ModulePubkeysConfigType } from '../types/Federation';
import { Wallet } from '../exports';

type EventWithStatus = {
  startEvent: NDKEvent | undefined;
  statusEvent: NDKEvent | undefined;
};

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

async function formatStartTransaction(userPubkey: string, modulePubkeys: ModulePubkeysConfigType, event: NDKEvent) {
  const nostrEvent: NostrEvent = await event.toNostrEvent();
  const AuthorIsCard: boolean = event.pubkey === modulePubkeys.card;

  //   const DelegatorIsUser: boolean = AuthorIsCard && nip26.getDelegator(nostrEvent as Event) === pubkey;
  const AuthorIsUser: boolean = event.pubkey === userPubkey;

  if (AuthorIsCard) {
    const delegation_pTags: string[] = getMultipleTagsValues(event.tags, 'p');
    if (!delegation_pTags.includes(userPubkey)) return;
  }

  const direction = AuthorIsUser ? TransactionDirection.OUTGOING : TransactionDirection.INCOMING;

  const eventContent = parseContent(event.content);
  //   const metadata = await extractMetadata(nostrEvent, direction);

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

async function fillTransaction(
  userPubkey: string,
  modulePubkeys: ModulePubkeysConfigType,
  txEvents: EventWithStatus,
  refundEvents: EventWithStatus,
) {
  let tmpTransaction: Transaction | undefined = await formatStartTransaction(
    userPubkey,
    modulePubkeys,
    txEvents.startEvent!,
  );
  if (!tmpTransaction) return;

  if (txEvents.statusEvent) tmpTransaction = await updateTxStatus(tmpTransaction, txEvents.statusEvent);

  if (refundEvents.startEvent)
    tmpTransaction = await markTxRefund(tmpTransaction, refundEvents.statusEvent || refundEvents.startEvent);

  return tmpTransaction;
}

export async function parseTransactions(wallet: Wallet, events: NDKEvent[]) {
  const transactions: Transaction[] = [];
  const [startedEvents, statusEvents, refundEvents] = filterEventsByTxType(events);

  await Promise.all(
    startedEvents!.map(async (startEvent) => {
      const [startWithStatus, refundWithStatus] = parseStatusEvents(startEvent, statusEvents, refundEvents);
      const transaction = await fillTransaction(
        wallet.pubkey,
        wallet.federation.modulePubkeys,
        startWithStatus!,
        refundWithStatus!,
      );
      if (transaction) transactions.push(transaction);
    }),
  );

  return transactions;
}
