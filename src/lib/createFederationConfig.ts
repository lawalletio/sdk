import { baseConfig } from '../constants/config.js';
import type { FederationConfig } from '../types/FederationConfig.js';

export interface CreateFederationConfigParams {
  federationId?: string;
  endpoints?: Partial<typeof baseConfig.endpoints>;
  modulePubkeys?: Partial<typeof baseConfig.modulePubkeys>;
  relaysList?: string[];
}

export function createFederationConfig(parameters: CreateFederationConfigParams = {}): FederationConfig {
  return {
    ...baseConfig,
    ...parameters,
    endpoints: {
      ...baseConfig.endpoints,
      ...parameters.endpoints,
    },
    modulePubkeys: {
      ...baseConfig.modulePubkeys,
      ...parameters.modulePubkeys,
    },
    relaysList: parameters.relaysList ?? baseConfig.relaysList,
  };
}
