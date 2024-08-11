import { baseConfig } from '../constants/config.js';
import type { LWConfig } from '../types/LWConfig.js';

export interface CreateFederationConfigParams {
  federationId?: string;
  endpoints?: Partial<typeof baseConfig.endpoints>;
  modulePubkeys?: Partial<typeof baseConfig.modulePubkeys>;
  relaysList?: string[];
}

export function createFederationConfig(parameters: CreateFederationConfigParams = {}): LWConfig {
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
