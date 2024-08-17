import NDK, { NDKUser, NDKUserProfile } from '@nostr-dev-kit/ndk';
import { nip19 } from 'nostr-tools';
import { createNDKInstance, fetchToNDK } from '../lib/ndk.js';
import { parseWalias } from '../lib/utils.js';
import { LNRequestResponse } from '../types/LnUrl.js';
import { Federation } from './Federation.js';

export type FetchParameters = {
  enabled: boolean;
  onFetch?: (data: any) => void;
};

const DEFAULT_FETCH_PARAMS: FetchParameters = {
  enabled: false,
};

type IdentityConstructorParameters = {
  pubkey: string;
  ndk?: NDK;
  federation?: Federation;
  fetchParams?: FetchParameters;
};

export class Identity {
  private _federation: Federation;
  private _pubkey: string;
  private _username: string = '';
  private _ndk: NDK;

  private _ln: LNRequestResponse | undefined;
  private _nostrProfile: NDKUserProfile | undefined;

  constructor(params: IdentityConstructorParameters) {
    if (!params.pubkey) throw new Error('You need to define a public key to instantiate an identity.');

    this._federation = params.federation ?? new Federation();
    this._pubkey = params.pubkey;

    this._ndk = params.ndk ?? createNDKInstance(this._federation.relaysList);

    const { fetchParams = DEFAULT_FETCH_PARAMS } = params;
    if (fetchParams.enabled)
      this.fetch().then((response) => {
        if (fetchParams.onFetch) fetchParams.onFetch(response);
      });
  }

  async fetchProfile() {
    if (!this._ndk) throw new Error('No NDK instance found');

    try {
      let user = new NDKUser({ pubkey: this.pubkey });
      user.ndk = this._ndk;

      let profile = await fetchToNDK<NDKUserProfile | null>(this.ndk, () => user.fetchProfile({ closeOnEose: true }));
      if (!profile) return;

      this._nostrProfile = profile;
      return profile;
    } catch (err) {
      return;
    }
  }

  async fetch(): Promise<{ lnurlpData: LNRequestResponse | undefined; nostr: NDKUserProfile | undefined }> {
    let nostr = await this.fetchProfile();

    try {
      const username: string = await this._federation.getUsername(this._pubkey);
      if (!username.length)
        throw new Error('No user was found in this federation that matches the provided public key.');

      this._username = username;

      let lnurlpData = await this._federation.getLnUrlpData(username);
      this._ln = lnurlpData;

      return {
        lnurlpData,
        nostr,
      };
    } catch (err) {
      return {
        lnurlpData: this._federation.getLUD06(this._pubkey),
        nostr,
      };
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

  get federation() {
    return this._federation;
  }

  get lnurlpData() {
    return this._ln;
  }

  get nostr() {
    return this._nostrProfile;
  }

  get ndk() {
    return this._ndk;
  }
}
