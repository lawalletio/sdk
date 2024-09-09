import { NDKKind, NDKTag, NostrEvent } from '@nostr-dev-kit/ndk';
import { nowInSeconds } from './utils.js';
import { LaWalletKinds, LaWalletTags } from '../constants/nostr.js';

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

export const buildIdentityEvent = (nonce: string, username: string, pubkey: string): NostrEvent => {
  return {
    pubkey,
    kind: LaWalletKinds.REGULAR,
    content: JSON.stringify({
      name: username,
      pubkey,
    }),
    tags: [
      ['t', LaWalletTags.CREATE_IDENTITY],
      ['name', username],
      ['nonce', nonce],
    ],
    created_at: nowInSeconds(),
  };
};
