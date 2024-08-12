import { LightningAddress } from '@getalby/lightning-tools';
import { nip19 } from 'nostr-tools';
import { getUsername, parseWalias } from '../lib/utils.js';
import type { CreateFederationConfigParams } from '../types/Federation.js';
import { Federation } from './Federation.js';

export class Identity {
  private _federation: Federation;
  private _username: string = '';
  private _ln: LightningAddress | undefined;
  private _pubkey: string;

  constructor(pubkey: string, federationConfig?: CreateFederationConfigParams) {
    if (!pubkey) throw new Error('You need to define a public key to instantiate an identity.');

    this._federation = new Federation(federationConfig);
    this._pubkey = pubkey;

    this.initializeWalias(pubkey, this._federation);
  }

  async initializeWalias(pubkey: string, federation: Federation) {
    const username: string = await getUsername(pubkey, federation.lightningDomain);

    if (username.length) {
      this._username = username;

      this._ln = new LightningAddress(parseWalias(username, federation.lightningDomain));
      await this._ln.fetch();
    }
  }

  get pubkey() {
    return this._pubkey;
  }

  get npub() {
    return nip19.npubEncode(this._pubkey);
  }

  get username() {
    return this._username;
  }

  get walias() {
    if (!this._username.length) return;

    return parseWalias(this._username, this._federation.lightningDomain);
  }

  get lnurlpData() {
    return this._ln?.lnurlpData;
  }
}
