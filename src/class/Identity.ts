import { LightningAddress } from '@getalby/lightning-tools';
import NDK, { NDKEvent } from '@nostr-dev-kit/ndk';
import { kinds, nip19 } from 'nostr-tools';
import { createNDKInstance, getUsername, parseWalias } from '../lib/utils.js';
import type { CreateFederationConfigParams } from '../types/Federation.js';
import { Federation } from './Federation.js';

export class Identity {
  private _federation: Federation;
  private _pubkey: string;
  private _username: string = '';

  private _ln: LightningAddress | null = null;
  // private _nostrProfile: NDKUserProfile;

  constructor(pubkey: string, federationConfig?: CreateFederationConfigParams, fetchData: boolean = false) {
    if (!pubkey) throw new Error('You need to define a public key to instantiate an identity.');

    this._federation = new Federation(federationConfig);
    this._pubkey = pubkey;

    if (fetchData) this.fetch();
  }

  async fetchProfile(ndk?: NDK) {
    ndk ??= await createNDKInstance(this._federation.relaysList, true);

    if (!ndk) throw new Error('No NDK instance found');

    const event: NDKEvent | null = await ndk.fetchEvent({
      kinds: [kinds.Metadata],
      authors: [this._pubkey],
    });

    // TODO: parse user profile from event
    // add _nostrProfile to Identity

    return event ? await event.toNostrEvent() : undefined;
  }

  async fetch() {
    const username: string = await getUsername(this._pubkey, this._federation.lightningDomain);
    if (!username.length) return;

    let ln = new LightningAddress(parseWalias(username, this._federation.lightningDomain));
    await ln.fetch();

    this._username = username;
    this._ln = ln;

    return {
      walias: this.walias,
      ln,
    };
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

  get lnurlp() {
    return this._ln;
  }
}
