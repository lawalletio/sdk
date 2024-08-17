import NDK, { NDKFilter, NDKTag, type NostrEvent } from '@nostr-dev-kit/ndk';
import { LNRequestResponse } from './LnUrl.js';
import { Federation } from '../class/Federation.js';

export interface Transaction {
  id: string;
  status: TransactionStatus;
  direction: TransactionDirection;
  type: TransactionType;
  tokens: TokensAmount;
  memo: string;
  errors: string[];
  events: NostrEvent[];
  createdAt: number;
  metadata?: Record<string, string>;
}

export type TransactionParams = {
  tokenId: string;
  amount: number;
  senderPubkey: string;
  comment?: string;
  tags: NDKTag[];
};

export interface TransferInformation {
  data: string;
  amount: number;
  type: TransferTypes;
}

export interface LNURLTransferType extends TransferInformation {
  lnurlpData: LNRequestResponse | null;
}

export interface InvoiceTransferType extends TransferInformation {
  expired: boolean;
}

export enum TransferTypes {
  INTERNAL = 'INTERNAL',
  LUD16 = 'LUD16',
  INVOICE = 'INVOICE',
  LNURL = 'LNURL',
  LNURLW = 'LNURLW',
  NONE = 'NONE',
}

export enum TransactionStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  ERROR = 'ERROR',
  REVERTED = 'REVERTED',
}

export enum TransactionDirection {
  INCOMING = 'INCOMING',
  OUTGOING = 'OUTGOING',
}

export enum TransactionType {
  CARD = 'CARD',
  INTERNAL = 'INTERNAL',
  LN = 'LN',
}

export type TokensAmount = {
  [_tokenId: string]: number;
};

export interface TransactionStatusParams {
  onSuccess?: (event: NostrEvent) => void;
  onError?: (reason: string) => void;
}

export interface SendTransactionParams extends TransactionStatusParams {
  tokenId: string;
  receiver: string;
  amount: number;
  comment?: string;
}

export interface InvoiceTransactionParams extends TransactionStatusParams {
  paymentRequest: string;
  metadata?: Record<string, string>;
}

export interface InternalTransactionParams extends SendTransactionParams {
  metadata?: Record<string, string>;
}

export interface ExecuteTransactionParams extends TransactionStatusParams {
  type: 'internal' | 'external';
  ndk: NDK;
  startEvent: NostrEvent;
  federation: Federation;
}
