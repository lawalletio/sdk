import type { EndpointsConfigType, LWConfig, ModulePubkeysConfigType } from '../types/LWConfig.js';
import { createFederationConfig, type CreateFederationConfigParams } from '../utils/createFederationConfig.js';

export class Federation {
  config: LWConfig;

  constructor(federationConfig?: CreateFederationConfigParams) {
    this.config = createFederationConfig(federationConfig);
  }

  get id(): string {
    return this.config.federationId;
  }

  get endpoints(): EndpointsConfigType {
    return this.config.endpoints;
  }

  get modulePubkeys(): ModulePubkeysConfigType {
    return this.config.modulePubkeys;
  }

  get relaysList(): string[] {
    return this.config.relaysList;
  }
}
