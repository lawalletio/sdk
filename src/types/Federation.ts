import { LAWALLET_DEFAULT_CONFIG } from '../constants/config';

export type EndpointsConfigType = {
  lightningDomain: string;
  gateway: string;
};

export type ModulePubkeysConfigType = {
  card: string;
  ledger: string;
  urlx: string;
};

export interface FederationConfig {
  federationId: string;
  endpoints: EndpointsConfigType;
  modulePubkeys: ModulePubkeysConfigType;
  relaysList: string[];
}

export interface CreateFederationConfigParams {
  federationId?: string;
  endpoints?: Partial<typeof LAWALLET_DEFAULT_CONFIG.endpoints>;
  modulePubkeys?: Partial<typeof LAWALLET_DEFAULT_CONFIG.modulePubkeys>;
  relaysList?: string[];
}
