import { NDKTag } from '@nostr-dev-kit/ndk';

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

export const getTagValue = (tags: NDKTag[], keyTag: string): string => {
  const tag: NDKTag | undefined = tags.find((tag) => tag[0] === keyTag);
  return tag ? tag[1]! : '';
};

export const getTag = (tags: NDKTag[], keyTag: string): NDKTag | undefined => {
  const tagValue = tags.find((tag) => tag[0] === keyTag);
  return tagValue;
};

export const getMultipleTagsValues = (tags: NDKTag[], keyTag: string) => {
  const values: string[] = [];

  const tagsValue: NDKTag[] = tags.filter((tag) => tag[0] === keyTag);
  tagsValue.forEach((tag) => values.push(tag[1]!));

  return values;
};

export function parseContent(content: string) {
  try {
    const parsed = JSON.parse(content);
    return parsed;
  } catch {
    return {};
  }
}

export function escapingBrackets(text: string) {
  return text.replace(/\[/g, '\\[\\').replace(/]/g, '\\]\\');
}

export function unescapingText(text: string) {
  return text.replace(/\\/g, '');
}

export function extractEscappedMessage(text: string) {
  const regex = /(?<!\\)\[([^\]]+)]/g;
  const fragments = text.split(regex);

  const escappedMessage = fragments.filter((_, index) => index % 2 === 0).join('');

  return escappedMessage;
}
