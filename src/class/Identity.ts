import { Federation } from './Federation.js';
import { type CreateFederationConfigParams } from '../lib/createFederationConfig.js';
import { getUsername, normalizeLightningDomain } from '../lib/utils.js';

export class Identity {
  federation: Federation;
  username: string = '';
  //npub / lud16 / nip05
  //payrequest / LightningAddress

  constructor(pubkey: string, federationConfig?: CreateFederationConfigParams) {
    if (!pubkey) throw new Error('You need to define a public key to instantiate an identity.');

    this.federation = new Federation(federationConfig);

    getUsername(pubkey, this.federation.lightningDomain).then((username: string) => {
      if (username) this.username = username;
    });
  }

  get walias() {
    let domain = normalizeLightningDomain(this.federation.lightningDomain);
    return `${this.username}@${domain}`;
  }
}
