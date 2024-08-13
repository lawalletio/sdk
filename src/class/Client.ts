import NDK, { NDKFilter } from '@nostr-dev-kit/ndk';
import type { CreateFederationConfigParams } from '../types/Federation';
import { Federation } from './Federation';
import { Wallet } from './Wallet';

export class Client {
  private _ndk: NDK;
  private _federation: Federation;
  private accounts: Wallet[] = [];

  constructor(federationParams: CreateFederationConfigParams) {
    this._federation = new Federation(federationParams);
    this._ndk = new NDK({ explicitRelayUrls: this._federation.relaysList });
  }

  get federation() {
    return this._federation;
  }

  get ndk() {
    return this._ndk;
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
