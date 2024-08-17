import { LaWalletTags } from './nostr.js';

export const startTags: string[] = [LaWalletTags.INTERNAL_TRANSACTION_START, LaWalletTags.INBOUND_TRANSACTION_START];

export const statusTags: string[] = [
  LaWalletTags.INTERNAL_TRANSACTION_OK,
  LaWalletTags.INTERNAL_TRANSACTION_ERROR,
  LaWalletTags.OUTBOUND_TRANSACTION_OK,
  LaWalletTags.OUTBOUND_TRANSACTION_ERROR,
  LaWalletTags.INBOUND_TRANSACTION_OK,
  LaWalletTags.INBOUND_TRANSACTION_ERROR,
];
