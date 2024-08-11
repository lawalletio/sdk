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
