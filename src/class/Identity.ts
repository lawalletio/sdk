import { LightningAddress } from '@getalby/lightning-tools';
import { nip19 } from 'nostr-tools';
import { getUsername, parseWalias } from '../lib/utils.js';
import type { CreateFederationConfigParams } from '../types/Federation.js';
import { Federation } from './Federation.js';

export class Identity {
  private _federation: Federation;
  private _pubkey: string;

  private _username: string = '';
  private _ln: LightningAddress | undefined;

  constructor(pubkey: string, federationConfig?: CreateFederationConfigParams) {
    if (!pubkey) throw new Error('You need to define a public key to instantiate an identity.');

    this._federation = new Federation(federationConfig);
    this._pubkey = pubkey;
    this.fetch();
  }

  async fetch() {
    const username: string = await getUsername(this._pubkey, this._federation.lightningDomain);
    if (!username.length) return;

    this._username = username;

    this._ln = new LightningAddress(parseWalias(username, this._federation.lightningDomain));
    await this._ln.fetch();

    return this._ln.lnurlpData;
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
