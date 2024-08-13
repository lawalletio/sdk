import NDK, { NDKKind, NDKPrivateKeySigner, NDKSigner, NDKTag, NostrEvent } from '@nostr-dev-kit/ndk';
import { getPublicKey } from 'nostr-tools';
import { checkRelaysConnection, disconnectRelays, hexToUint8Array, LaWalletKinds } from '../lib/utils';
import type { CreateFederationConfigParams } from '../types/Federation';
import { Transaction } from '../types/Transaction';
import { FetchParameters, Identity } from './Identity';

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
      // TODO: Refactor the way to retrieve the public key
      const pubkey = getPublicKey(hexToUint8Array(signer.privateKey));
      super({ pubkey, ndk: params?.ndk, federationConfig: params?.federationConfig, fetchParams: params?.fetchParams });

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

  signEvent(event: NostrEvent): NostrEvent {
    console.log(event);
    return {} as NostrEvent;
  }

  sendTransaction(transaction: string): boolean {
    console.log(transaction);
    return true;
  }
}
