import { NDKTag, NostrEvent } from '@nostr-dev-kit/ndk';
import { getPublicKey } from 'nostr-tools';
import { hexToUint8Array } from '../lib/utils.js';
import type { CreateFederationConfigParams } from '../types/Federation.js';
import { Transaction } from '../types/Transaction.js';
import { Identity } from './Identity.js';

type WalletParameters = {
  federationConfig?: CreateFederationConfigParams;
  privateKey: string; // TODO: Change Private Key to signer:NDKSigner
};

export class Wallet extends Identity {
  constructor(params: WalletParameters) {
    if (!params.privateKey) throw new Error('A signer is required to create a wallet instance.');

    try {
      // TODO: Refactor the way to retrieve the public key
      const pubkey = getPublicKey(hexToUint8Array(params.privateKey));
      super(pubkey, params.federationConfig);
    } catch (err) {
      console.log(err);
      throw new Error('An error occurred while instantiating the wallet');
    }
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
