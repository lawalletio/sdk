import NDK, { NDKSigner } from '@nostr-dev-kit/ndk';

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
