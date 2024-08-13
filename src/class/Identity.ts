import { LightningAddress } from '@getalby/lightning-tools';
import NDK, { NDKUser, NDKUserProfile } from '@nostr-dev-kit/ndk';
import { nip19 } from 'nostr-tools';
import { checkRelaysConnection, createNDKInstance, disconnectRelays, getUsername, parseWalias } from '../lib/utils';
import type { CreateFederationConfigParams } from '../types/Federation';
import { Federation } from './Federation';

type FetchParameters = {
  enabled: boolean;
  onFetch?: (data: any) => void;
};

const DEFAULT_FETCH_PARAMS: FetchParameters = {
  enabled: false,
};

type IdentityConstructorParameters = {
  pubkey: string;
  federationConfig?: CreateFederationConfigParams;
  ndk?: NDK;
  fetchParams?: FetchParameters;
};

export class Identity {
  private _federation: Federation;
  private _pubkey: string;
  private _username: string = '';
  private _ndk: NDK;

  private _ln: LightningAddress | undefined;
  private _nostrProfile: NDKUserProfile | undefined;

  constructor(params: IdentityConstructorParameters) {
    if (!params.pubkey) throw new Error('You need to define a public key to instantiate an identity.');

    this._federation = new Federation(params.federationConfig);
    this._pubkey = params.pubkey;

    this._ndk = params.ndk ?? createNDKInstance(this._federation.relaysList);

    const { fetchParams = DEFAULT_FETCH_PARAMS } = params;
    if (fetchParams.enabled)
      this.fetch().then((response) => {
        if (fetchParams.onFetch) fetchParams.onFetch(response);
      });
  }

  async fetchProfile(ndk?: NDK) {
    ndk ??= this._ndk;
    if (!ndk) throw new Error('No NDK instance found');

    try {
      let openNewConnection: boolean = await checkRelaysConnection(ndk);

      let user = new NDKUser({ pubkey: this.pubkey });
      user.ndk = ndk;

      let profile = await user.fetchProfile({ closeOnEose: true });
      if (openNewConnection) disconnectRelays(ndk);

      if (!profile) return;

      this._nostrProfile = profile;
      return profile;
    } catch (err) {
      return;
    }
  }

  async fetch(ndk?: NDK) {
    ndk ??= this._ndk;
    let profile = await this.fetchProfile(ndk);

    try {
      const username: string = await getUsername(this._pubkey, this._federation.lightningDomain);
      if (!username.length)
        throw new Error('No user was found in this federation that matches the provided public key.');

      this._username = username;

      let ln = new LightningAddress(parseWalias(username, this._federation.lightningDomain));
      await ln.fetch();

      this._ln = ln;

      return {
        ln,
        profile,
      };
    } catch (err) {
      return {
        ln: undefined,
        profile,
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

  get ln() {
    return this._ln;
  }

  get nostr() {
    return this._nostrProfile;
  }
}
