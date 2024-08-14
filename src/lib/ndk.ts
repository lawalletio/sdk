import NDK, { NDKFilter, NDKKind, NDKSigner } from '@nostr-dev-kit/ndk';
import { LaWalletKinds, LaWalletTags } from '../constants/nostr';
import { startTags, statusTags } from '../constants/tags';
import { ModulePubkeysConfigType } from '../types/Federation';
import { ConfigTypes } from '../types/Card';

export function createNDKInstance(relaysList: string[], signer?: NDKSigner): NDK {
  const tmpNDK = new NDK({
    explicitRelayUrls: relaysList,
    signer,
  });

  return tmpNDK;
}

async function checkRelaysConnection(ndk: NDK) {
  if (ndk.pool.urls().length === 0) throw new Error('No relays found');

  let connectedRelays: number = ndk.pool.connectedRelays().length;

  if (connectedRelays === 0) {
    await ndk.connect();
    return false;
  }

  return true;
}

function killRelaysConnection(ndk: NDK) {
  const relays = ndk.pool.connectedRelays();
  relays.map((relay) => relay.disconnect());

  ndk.pool.removeAllListeners();
  ndk.removeAllListeners();

  return;
}

export async function fetchToNDK<T>(ndk: NDK, fn: () => Promise<T>) {
  let relaysConnectedBeforeFetch: boolean = await checkRelaysConnection(ndk);

  const response = await fn();
  if (!relaysConnectedBeforeFetch) killRelaysConnection(ndk);

  return response;
}

export function transactionsFilters(
  pubkey: string,
  modulePubkeys: ModulePubkeysConfigType,
  filters: Partial<NDKFilter>,
) {
  return [
    {
      authors: [pubkey],
      kinds: [LaWalletKinds.REGULAR as unknown as NDKKind],
      '#t': [LaWalletTags.INTERNAL_TRANSACTION_START],
      ...filters,
    },
    {
      '#p': [pubkey],
      '#t': startTags,
      kinds: [LaWalletKinds.REGULAR as unknown as NDKKind],
      ...filters,
    },
    {
      authors: [modulePubkeys.ledger],
      kinds: [LaWalletKinds.REGULAR as unknown as NDKKind],
      '#p': [pubkey],
      '#t': statusTags,
      ...filters,
    },
  ];
}

export function cardsFilter(pubkey: string, cardPubkey: string) {
  return [
    {
      kinds: [LaWalletKinds.PARAMETRIZED_REPLACEABLE.valueOf() as NDKKind],
      '#d': [`${pubkey}:${ConfigTypes.DATA.valueOf()}`, `${pubkey}:${ConfigTypes.CONFIG.valueOf()}`],
      authors: [cardPubkey],
    },
  ];
}
