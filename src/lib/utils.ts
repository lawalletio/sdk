import NDK, { NDKSigner } from '@nostr-dev-kit/ndk';

export enum LaWalletKinds {
  REGULAR = 1112,
  EPHEMERAL = 21111,
  PARAMETRIZED_REPLACEABLE = 31111,
}

export const nowInSeconds = (): number => {
  return Math.floor(Date.now() / 1000);
};

export const normalizeLightningDomain = (lightningDomain: string) => {
  try {
    const iURL = new URL(lightningDomain);
    return iURL.hostname;
  } catch {
    return '';
  }
};

export const parseWalias = (username: string, lightningDomain: string) => {
  return `${username}@${normalizeLightningDomain(lightningDomain)}`;
};

export function hexToUint8Array(hex: string): Uint8Array {
  if (hex.length % 2 !== 0) {
    throw new Error('The hex string must have an even number of characters.');
  }

  const length = hex.length / 2;
  const uint8Array = new Uint8Array(length);

  for (let i = 0; i < length; i++) {
    uint8Array[i] = parseInt(hex.substr(i * 2, 2), 16);
  }

  return uint8Array;
}

export function uint8ArrayToHex(uint8Array: Uint8Array): string {
  return Array.from(uint8Array)
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

export function createNDKInstance(relaysList: string[], signer?: NDKSigner): NDK {
  const tmpNDK = new NDK({
    explicitRelayUrls: relaysList,
    signer,
  });

  return tmpNDK;
}

export async function checkRelaysConnection(ndk: NDK) {
  if (ndk.pool.urls().length === 0) throw new Error('No relays found');

  let connectedRelays: number = ndk.pool.connectedRelays().length;

  if (connectedRelays === 0) {
    await ndk.connect();
    return true;
  }

  return false;
}

export function disconnectRelays(ndk: NDK) {
  const relays = ndk.pool.connectedRelays();
  relays.map((relay) => relay.disconnect());

  ndk.pool.removeAllListeners();
  ndk.removeAllListeners();

  return;
}
