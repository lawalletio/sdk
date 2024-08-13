import { Api } from '../lib/api';
import { createFederationConfig } from '../lib/createFederationConfig';
import type { CreateFederationConfigParams, FederationConfig, ModulePubkeysConfigType } from '../types/Federation';
import { LNRequestResponse } from '../types/LnUrl';

export class Federation {
  private _config: FederationConfig;

  constructor(federationConfig?: CreateFederationConfigParams) {
    this._config = createFederationConfig(federationConfig);
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

  async getUsername(pubkey: string): Promise<string> {
    const api = Api();
    const request: { username: string } = await api.get(`${this.lightningDomain}/api/pubkey/${pubkey}`);
    if (!request || !request.username) return '';

    return request.username;
  }

  async getLnUrlpData(username: string): Promise<LNRequestResponse | undefined> {
    const api = Api();
    const lnurlpData: LNRequestResponse | undefined = await api.get(
      `${this.lightningDomain}/.well-known/lnurlp/${username}`,
    );

    return lnurlpData;
  }
}
