import { Federation } from './Federation.js';
import { type CreateFederationConfigParams } from '../utils/createFederationConfig.js';

export class Identity {
  federation: Federation;
  //npub / lud16 / nip05
  //payrequest / LightningAddress

  constructor(pubkey: string, federationConfig?: CreateFederationConfigParams) {
    if (!pubkey) throw new Error('You need to define a public key to instantiate an identity.');

    this.federation = new Federation(federationConfig);

    // ... instantiate identity
  }
}
