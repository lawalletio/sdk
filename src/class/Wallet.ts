import { NDKSigner, NDKTag, NostrEvent } from '@nostr-dev-kit/ndk';
import type { CreateFederationConfigParams } from '../types/Federation.js';
import { Transaction } from '../types/Transaction.js';
import { Identity } from './Identity.js';

type WalletParameters = {
  signer: NDKSigner;
  federationConfig?: CreateFederationConfigParams;
};

export class Wallet extends Identity {
  constructor(params: WalletParameters) {
    const pubkey = ''; //obtener pubkey del signer

    super(pubkey, params.federationConfig);
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
