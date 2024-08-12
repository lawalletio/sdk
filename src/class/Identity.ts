import { LightningAddress } from '@getalby/lightning-tools';
import NDK, { NDKUser, NDKUserProfile } from '@nostr-dev-kit/ndk';
import { nip19 } from 'nostr-tools';
import { createNDKInstance, getUsername, parseWalias } from '../lib/utils.js';
import type { CreateFederationConfigParams } from '../types/Federation.js';
import { Federation } from './Federation.js';

export class Identity {
  private _federation: Federation;
  private _pubkey: string;
  private _username: string = '';

  private _ln: LightningAddress | undefined;
  private _nostrProfile: NDKUserProfile | undefined;

  constructor(pubkey: string, federationConfig?: CreateFederationConfigParams, fetchData: boolean = false) {
    if (!pubkey) throw new Error('You need to define a public key to instantiate an identity.');

    this._federation = new Federation(federationConfig);
    this._pubkey = pubkey;

    if (fetchData) this.fetch();
  }

  async fetchProfile(ndk?: NDK) {
    ndk ??= await createNDKInstance(this._federation.relaysList, true);
    if (!ndk) throw new Error('No NDK instance found');

    let user = new NDKUser({ pubkey: this.pubkey });
    user.ndk = ndk;

    try {
      let profile = await user.fetchProfile();
      if (!profile) return;

      this._nostrProfile = profile;
      return profile;
    } catch {
      return;
    }
  }

  async fetch() {
    try {
      const username: string = await getUsername(this._pubkey, this._federation.lightningDomain);
      if (!username.length)
        throw new Error('No user was found in this federation that matches the provided public key.');

      this._username = username;

      let ln = new LightningAddress(parseWalias(username, this._federation.lightningDomain));
      await ln.fetch();

      this._ln = ln;

      let profile = await this.fetchProfile();

      return {
        walias: this.walias,
        ln,
        profile,
      };
    } catch (err) {
      return;
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

  get ln() {
    return this._ln;
  }

  get profile() {
    return this._nostrProfile;
  }
}
