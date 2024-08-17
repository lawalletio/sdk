import { NostrEvent } from '@nostr-dev-kit/ndk';
import { Api } from '../lib/api.js';
import { createFederationConfig } from '../lib/createFederationConfig.js';
import type { CreateFederationConfigParams, FederationConfig, ModulePubkeysConfigType } from '../types/Federation.js';
import { LNRequestResponse } from '../types/LnUrl.js';

export class Federation {
  private _config: FederationConfig;
  private _api: Api;

  constructor(federationConfig?: CreateFederationConfigParams) {
    this._config = createFederationConfig(federationConfig);
    this._api = Api();
  }

  get id(): string {
    return this._config.federationId;
  }

  get lightningDomain(): string {
    return this._config.endpoints.lightningDomain;
  }

  get apiGateway(): string {
    return this._config.endpoints.gateway;
  }

  get modulePubkeys(): ModulePubkeysConfigType {
    return this._config.modulePubkeys;
  }

  get relaysList(): string[] {
    return this._config.relaysList;
  }

  getLUD06(pubkey: string) {
    // return this._api.get(`${this.lightningDomain}/api/lud06/${pubkey}`);
    return {
      status: 'OK',
      tag: 'payRequest',
      commentAllowed: 255,
      callback: `${this.apiGateway}/lnurlp/${pubkey}/callback`,
      metadata: '[["text/plain", "lawallet"]]',
      minSendable: 1000,
      maxSendable: 10000000000,
      payerData: {
        name: { mandatory: false },
        email: { mandatory: false },
        pubkey: { mandatory: false },
      },
      nostrPubkey: this.modulePubkeys.urlx,
      allowsNostr: true,
      federationId: this.id,
      accountPubKey: pubkey,
    };
  }

  async httpPublish(event: NostrEvent) {
    const res = await this._api.post(`${this.apiGateway}/nostr/publish`, { body: JSON.stringify(event) }, false);
    return res.status === 200 || res.status === 202;
  }

  async getUsername(pubkey: string): Promise<string> {
    const request: { username: string } = await this._api.get(`${this.lightningDomain}/api/pubkey/${pubkey}`);
    if (!request || !request.username) return '';

    return request.username;
  }

  async getLnUrlpData(username: string): Promise<LNRequestResponse | undefined> {
    const lnurlpData: LNRequestResponse | undefined = await this._api.get(
      `${this.lightningDomain}/.well-known/lnurlp/${username}`,
    );

    return lnurlpData;
  }
}
