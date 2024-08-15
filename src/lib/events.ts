import { NDKKind, NDKTag, NostrEvent } from '@nostr-dev-kit/ndk';
import { nowInSeconds } from './utils';

export const buildZapRequestEvent = (
  senderPubkey: string,
  receiverPubkey: string,
  amount: number,
  relaysList: string[],
  tags: NDKTag[] = [],
): NostrEvent => {
  if (relaysList.length <= 0) throw new Error('You need to define the list of relays');

  return {
    pubkey: senderPubkey,
    content: '',
    kind: NDKKind.ZapRequest,
    tags: [['p', receiverPubkey], ['amount', amount.toString()], ['relays', ...relaysList], ...tags],
    created_at: nowInSeconds(),
  };
};
