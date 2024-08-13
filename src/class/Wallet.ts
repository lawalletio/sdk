import NDK, { NDKPrivateKeySigner, NDKSigner, NDKTag, NostrEvent } from '@nostr-dev-kit/ndk';
import { getPublicKey } from 'nostr-tools';
import { hexToUint8Array } from '../lib/utils';
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

  getTransactions(): Transaction[] {
    return [];
  }

  getBalance(): number {
    return 0;
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
