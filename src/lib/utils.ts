import { LAWALLET_DEFAULT_CONFIG } from '../constants/config';

export const getUsername = (
  pubkey: string,
  lightningDomain: string = LAWALLET_DEFAULT_CONFIG.endpoints.lightningDomain,
) => {
  return fetch(`${lightningDomain}/api/pubkey/${pubkey}`)
    .then(async (res) => {
      const response = (await res.json()) as { username: string };

      if (!response || !response.username) return '';
      return response.username;
    })
    .catch(() => '');
};

export const normalizeLightningDomain = (lightningDomain: string) => {
  try {
    const iURL = new URL(lightningDomain);
    return iURL.hostname;
  } catch {
    return '';
  }
};
