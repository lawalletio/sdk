import { NDKEvent } from '@nostr-dev-kit/ndk';
import { extendedDecrypt, extendedMultiNip04Decrypt } from './nip04';
import { Wallet } from '../exports';
import { getTagValue, parseContent } from './utils';
import { CardConfigPayload, CardDataPayload, CardsInfo, ConfigTypes } from '../types/Card';

export async function parseCardsEvents(wallet: Wallet, events: NDKEvent[]) {
  let cards: CardsInfo = { data: {} as CardDataPayload, config: {} as CardConfigPayload };

  const decrypt = (senderPubkey: string, message: string) => extendedDecrypt(wallet.signer, senderPubkey, message);

  await Promise.all(
    events.map(async (cardEvent) => {
      try {
        const nostrEv = await cardEvent.toNostrEvent();
        const decryptedContent = await extendedMultiNip04Decrypt(nostrEv, wallet.pubkey, decrypt);
        const parsedDecryptedData = parseContent(decryptedContent);

        const subkind = getTagValue(nostrEv.tags, 't');
        if (!subkind) return;

        if (subkind === ConfigTypes.DATA) {
          cards.data = parsedDecryptedData as CardDataPayload;
        } else if (subkind === ConfigTypes.CONFIG) {
          cards.config = parsedDecryptedData as CardConfigPayload;
        }
      } catch (error) {
        console.error('Error parsing event:', error);
      }
    }),
  );

  return cards;
}
