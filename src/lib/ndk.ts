import NDK, { NDKSigner } from '@nostr-dev-kit/ndk';

export function createNDKInstance(relaysList: string[], signer?: NDKSigner): NDK {
  const tmpNDK = new NDK({
    explicitRelayUrls: relaysList,
    autoConnectUserRelays: false,
    autoFetchUserMutelist: false,
    signer,
  });

  return tmpNDK;
}

export async function checkRelaysConnection(ndk: NDK) {
  const relayUrls = ndk.pool.urls();
  if (relayUrls.length === 0) throw new Error('No relays found');

  let connectedRelays = ndk.pool.connectedRelays().length;

  if (connectedRelays !== relayUrls.length) {
    relayUrls.map((relayUrl: string) => {
      let relay = ndk.pool.relays.get(relayUrl);
      if (relay && !relay.connected) relay.connect();
    });

    return false;
  }
  return true;
}

export function killRelaysConnection(ndk: NDK) {
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
