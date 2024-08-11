import { createFederationConfig } from '../lib/createFederationConfig.js';
import type { CreateFederationConfigParams, FederationConfig, ModulePubkeysConfigType } from '../types/Federation.js';

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
}
