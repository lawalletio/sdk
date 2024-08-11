import { Identity } from './Identity.js';
import { type CreateFederationConfigParams } from '../utils/createFederationConfig.js';
import { Transaction } from '../types/Transaction.js';
import { NDKSigner, NDKTag, NostrEvent } from '@nostr-dev-kit/ndk';

type WalletParameters = {
  signer: NDKSigner;
  federationConfig?: CreateFederationConfigParams;
};

export class Wallet extends Identity {
  constructor(params: WalletParameters) {
    const pubkey = ''; //obtener pubkey del signer

    super(pubkey, params.federationConfig);
  }

  getAddress(): string {
    return `@${this.federation.id}`;
  }

  getWalias(): string {
    return `.wallet`;
  }

  getTransactions(): Transaction[] {
    // Lógica para obtener las transacciones del usuario
    return []; // Array de transacciones
  }

  getBalance(): number {
    // Lógica para obtener el balance de la wallet
    return 0; // Balance en alguna unidad monetaria
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
    // publish transaction on relay
    // console.log('Transaction sent:', transaction);
    return true;
  }
}
