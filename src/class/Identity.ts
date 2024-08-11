import { getUsername, normalizeLightningDomain } from '../lib/utils.js';
import type { CreateFederationConfigParams } from '../types/Federation.js';
import { Federation } from './Federation.js';

export class Identity {
  private _federation: Federation;
  private _username: string = '';
  //npub / lud16 / nip05
  //payrequest / LightningAddress

  constructor(pubkey: string, federationConfig?: CreateFederationConfigParams) {
    if (!pubkey) throw new Error('You need to define a public key to instantiate an identity.');

    this._federation = new Federation(federationConfig);

    getUsername(pubkey, this._federation.lightningDomain).then((username: string) => {
      if (username) this._username = username;
    });
  }

  get username() {
    return this._username;
  }

  get walias() {
    let domain = normalizeLightningDomain(this._federation.lightningDomain);
    return `${this.username}@${domain}`;
  }
}
