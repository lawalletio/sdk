import { NDKPrivateKeySigner } from '@nostr-dev-kit/ndk';

export async function createSigner(privateKey: Uint8Array | string) {
  return new NDKPrivateKeySigner(privateKey);
}
