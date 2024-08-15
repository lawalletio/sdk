export enum CardStatus {
  ENABLED = 'ENABLED',
  DISABLED = 'DISABLED',
}

export enum ConfigTypes {
  DATA = 'card-data',
  CONFIG = 'card-config',
}

export type Design = { uuid: string; name: string; description: string };
export type CardDataPayload = { [uuid: string]: { design: Design } };

export type Limit = {
  name: string;
  description: string;
  token: string;
  amount: bigint | string;
  delta: number;
};

export type CardPayload = {
  name: string;
  description: string;
  status: string;
  limits: Limit[];
};

export type CardConfigPayload = {
  'trusted-merchants': { pubkey: string }[];
  cards: { [uuid: string]: CardPayload };
};

export type CardsInfo = {
  data: CardDataPayload;
  config: CardConfigPayload;
};

export type CardMetadataParams = { name: string; description: string };

export type CardLimitTypes = 'transaction' | 'seconds' | 'minutes' | 'hours' | 'days' | 'weeks' | 'months' | 'years';

export type CardLimitParams = {
  tokenId: string;
  limitAmount: number;
  limitType: CardLimitTypes;
  limitTime?: number;
};
