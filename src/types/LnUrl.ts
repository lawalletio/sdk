export interface LNRequestResponse {
  tag: string;
  callback: string;
  metadata: string;
  commentAllowed: number;
  minSendable?: number;
  maxSendable?: number;
  k1?: string;
  minWithdrawable?: number;
  maxWithdrawable?: number;
  federationId?: string;
  accountPubKey?: string;
}
