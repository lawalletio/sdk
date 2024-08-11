import NDK, { NDKFilter } from '@nostr-dev-kit/ndk';
import { type CreateFederationConfigParams } from '../utils/createFederationConfig.js';
import { Federation } from './Federation.js';
import { Wallet } from './Wallet.js';

export class Client {
  private ndk: NDK;
  private federation: Federation;
  private accounts: Wallet[] = [];

  constructor(federationParams: CreateFederationConfigParams) {
    this.federation = new Federation(federationParams);
  }

  getAccounts(): Wallet[] {
    return this.accounts;
  }

  addAccount(index: number): void {
    console.log(index);
    // const newAccountName = `Account${index}`;
    // const newWallet = new Wallet(newAccountName, this.federation.config);
    // this.accounts.push(newWallet);
  }

  removeAccount(index: number): boolean {
    if (this.accounts.length < index - 1) return false;

    this.accounts.splice(index, 1);
    return true;
  }

  getTransaction(txId: string): void {
    console.log(txId);
    // return this.ndk.fetchEvents...
  }

  createEventFilter(filters: NDKFilter): void {
    console.log(filters);
    // create subscription
  }

  createTransactionFilter(pubkey: string): void {
    console.log(pubkey);
    // create subscription
  }
}
