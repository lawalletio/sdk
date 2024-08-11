import { LAWALLET_DEFAULT_CONFIG } from '../constants/config.js';
import type { CreateFederationConfigParams, FederationConfig } from '../types/Federation.js';

export function createFederationConfig(parameters: CreateFederationConfigParams = {}): FederationConfig {
  return {
    ...LAWALLET_DEFAULT_CONFIG,
    ...parameters,
    endpoints: {
      ...LAWALLET_DEFAULT_CONFIG.endpoints,
      ...parameters.endpoints,
    },
    modulePubkeys: {
      ...LAWALLET_DEFAULT_CONFIG.modulePubkeys,
      ...parameters.modulePubkeys,
    },
    relaysList: parameters.relaysList ?? LAWALLET_DEFAULT_CONFIG.relaysList,
  };
}
