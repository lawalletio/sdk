import { LightningAddress } from '@getalby/lightning-tools';
import { getUsername, normalizeLightningDomain, parseWalias } from '../lib/utils.js';
import type { CreateFederationConfigParams } from '../types/Federation.js';
import { Federation } from './Federation.js';
import { NDKUser } from '@nostr-dev-kit/ndk';

export class Identity {
  private _federation: Federation;
  private _username: string = '';
  private _ln: LightningAddress | undefined;
  private _user: NDKUser | undefined;

  constructor(pubkey: string, federationConfig?: CreateFederationConfigParams) {
    if (!pubkey) throw new Error('You need to define a public key to instantiate an identity.');

    this._federation = new Federation(federationConfig);
    this.initializeUser(pubkey, this._federation);
  }

  async initializeUser(pubkey: string, federation: Federation) {
    this._user = new NDKUser({ pubkey });
    await this._user.fetchProfile();

    const username: string = await getUsername(pubkey, federation.lightningDomain);

    if (username.length) {
      this._username = username;

      this._ln = new LightningAddress(parseWalias(username, federation.lightningDomain));
      await this._ln.fetch();
    }
  }

  get user() {
    return this._user;
  }

  get username() {
    return this._username;
  }

  get walias() {
    let domain = normalizeLightningDomain(this._federation.lightningDomain);
    return `${this.username}@${domain}`;
  }

  get lnurlpData() {
    return this._ln?.lnurlpData;
  }
}
