import NDK, { NDKEvent, NDKKind, NDKPrivateKeySigner, NDKSigner, NDKTag, NostrEvent } from '@nostr-dev-kit/ndk';
import { getPublicKey, UnsignedEvent } from 'nostr-tools';
import { LaWalletKinds } from '../constants/nostr';
import { Api } from '../lib/api';
import { cardsFilter, parseCardsEvents } from '../lib/cards';
import { buildZapRequestEvent } from '../lib/events';
import { createNDKInstance, fetchToNDK } from '../lib/ndk';
import { parseTransactionsEvents, transactionsFilters } from '../lib/transactions';
import { escapingBrackets, hexToUint8Array, nowInSeconds } from '../lib/utils';
import { CardsInfo } from '../types/Card';
import type { CreateFederationConfigParams } from '../types/Federation';
import { Transaction } from '../types/Transaction';
import { Card } from './Card';
import { Federation } from './Federation';
import { FetchParameters, Identity } from './Identity';

type WalletParameters = {
  signer?: NDKPrivateKeySigner; // TODO: Change NDKPrivateKeySigner to signer:NDKSigner
  ndk?: NDK;
  federationConfig?: CreateFederationConfigParams;
  fetchParams?: FetchParameters;
};

type ZapParams = {
  receiverPubkey: string;
  milisatoshis: number;
  comment?: string;
};

type InvoiceParams = {
  milisatoshis: number;
  comment?: string;
  nostr?: string;
};

export class Wallet extends Identity {
  private _signer: NDKSigner;

  constructor(params?: WalletParameters) {
    let signer = params?.signer ?? NDKPrivateKeySigner.generate();
    if (!signer.privateKey) throw new Error('A signer is required to create a wallet instance.');

    try {
      const federation = new Federation(params?.federationConfig);
      const ndk = params?.ndk ?? createNDKInstance(federation.relaysList, signer);

      // TODO: Refactor the way to retrieve the public key
      const pubkey = getPublicKey(hexToUint8Array(signer.privateKey));

      super({ pubkey, ndk, federation, fetchParams: params?.fetchParams });

      this._signer = signer;
    } catch (err) {
      console.log(err);
      throw err;
    }
  }

  get signer() {
    return this._signer;
  }

  async getBalance(tokenId: string): Promise<number> {
    if (!this.ndk) throw new Error('No NDK instance found');

    const fnFetch = () =>
      this.ndk.fetchEvent({
        authors: [this.federation.modulePubkeys.ledger],
        kinds: [LaWalletKinds.PARAMETRIZED_REPLACEABLE as unknown as NDKKind],
        '#d': [`balance:${tokenId}:${this.pubkey}`],
      });

    const event = await fetchToNDK<NDKEvent | null>(this.ndk, fnFetch);

    if (!event) {
      return 0;
    }

    return Number(event.getMatchingTags('amount')[0]?.[1]);
  }

  async getTransactions(): Promise<Transaction[]> {
    if (!this.ndk) throw new Error('No NDK instance found');

    const fnFetch = () => {
      let filters = transactionsFilters(this.pubkey, this.federation.modulePubkeys, { limit: 5000 });

      return this.ndk.fetchEvents(filters, {
        closeOnEose: true,
      });
    };

    const transactionEvents = await fetchToNDK<Set<NDKEvent>>(this.ndk, fnFetch);
    return parseTransactionsEvents(this, Array.from(transactionEvents));
  }

  async getCards() {
    if (!this.ndk) throw new Error('No NDK instance found');

    const fnFetch = () => {
      let filters = cardsFilter(this.pubkey, this.federation.modulePubkeys.card);

      return this.ndk.fetchEvents(filters, {
        closeOnEose: true,
      });
    };

    const cardsEvents = await fetchToNDK<Set<NDKEvent>>(this.ndk, fnFetch);
    const cardsInfo: CardsInfo = await parseCardsEvents(this, Array.from(cardsEvents));

    let cards: Card[] = [];

    for (const id in cardsInfo.data) {
      let design = cardsInfo.data[id].design;
      let cardConfig = cardsInfo.config.cards[id];

      cards.push(new Card(this, id, design, cardConfig));
    }

    return cards;
  }

  async createZap(params: ZapParams) {
    if (params.milisatoshis < 1000) throw new Error('The milisatoshis amount must be greater than or equal to 1000');

    const zapRequestEvent: NostrEvent | undefined = await this.signEvent(
      buildZapRequestEvent(this.pubkey, params.receiverPubkey, params.milisatoshis, this.federation.relaysList),
    );

    const zapRequestURI: string = encodeURI(JSON.stringify(zapRequestEvent));

    return this.generateInvoice({ milisatoshis: params.milisatoshis, nostr: zapRequestURI, comment: params.comment });
  }

  async generateInvoice(params: InvoiceParams) {
    let lnurlpData = this.lnurlpData ?? (await this.fetch()).lnurlpData;
    if (!lnurlpData) throw new Error('lnurlpData not found');

    const { milisatoshis, comment, nostr } = params;
    const api = Api();

    const response = await api.get(
      `${lnurlpData.callback}?amount=${milisatoshis}${nostr ? `&nostr=${nostr}` : ''}${comment ? `&comment=${escapingBrackets(comment)}` : ''}`,
    );
    if (!response) throw new Error('An error occurred while creating a invoice');

    return response;
  }

  prepareInternalTransaction(to: string, amount: number): NostrEvent {
    console.log(to, amount);
    return {} as NostrEvent;
  }

  prepareExternalTransaction(to: string, amount: number, tags: NDKTag[]): NostrEvent {
    console.log(to, amount, tags);
    return {} as NostrEvent;
  }

  async signEvent(event: Partial<NostrEvent>): Promise<NostrEvent> {
    if (!this.signer) throw new Error('Signer not found');

    try {
      const eventTemplate: UnsignedEvent = {
        kind: 0,
        content: '',
        created_at: nowInSeconds(),
        tags: [],
        pubkey: this.pubkey,
        ...event,
      };

      const ndkEvent: NDKEvent = new NDKEvent(this.ndk, eventTemplate);
      await ndkEvent.sign();

      return ndkEvent.toNostrEvent();
    } catch (err) {
      throw err;
    }
  }

  sendTransaction(transaction: string): boolean {
    console.log(transaction);
    return true;
  }
}
