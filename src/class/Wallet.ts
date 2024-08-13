import NDK, { NDKEvent, NDKKind, NDKPrivateKeySigner, NDKSigner, NDKTag, NostrEvent } from '@nostr-dev-kit/ndk';
import { getPublicKey, UnsignedEvent } from 'nostr-tools';
import {
  checkRelaysConnection,
  createNDKInstance,
  disconnectRelays,
  hexToUint8Array,
  LaWalletKinds,
  nowInSeconds,
} from '../lib/utils';
import type { CreateFederationConfigParams } from '../types/Federation';
import { Transaction } from '../types/Transaction';
import { FetchParameters, Identity } from './Identity';
import { Federation } from './Federation';

type WalletParameters = {
  signer?: NDKPrivateKeySigner; // TODO: Change NDKPrivateKeySigner to signer:NDKSigner
  ndk?: NDK;
  federationConfig?: CreateFederationConfigParams;
  fetchParams?: FetchParameters;
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

    let openNewConnection: boolean = await checkRelaysConnection(this.ndk);

    const event = await this.ndk.fetchEvent({
      authors: [this.federation.modulePubkeys.ledger],
      kinds: [LaWalletKinds.PARAMETRIZED_REPLACEABLE as unknown as NDKKind],
      '#d': [`balance:${tokenId}:${this.pubkey}`],
    });

    if (openNewConnection) disconnectRelays(this.ndk);

    if (!event) {
      return 0;
    }

    return Number(event.getMatchingTags('amount')[0]?.[1]);
  }

  getTransactions(): Transaction[] {
    return [];
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
