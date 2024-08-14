import { NDKEvent, NDKKind, NostrEvent } from '@nostr-dev-kit/ndk';
import { extendedDecrypt, extendedEncrypt, extendedMultiNip04Decrypt, extendedMultiNip04Encrypt } from './nip04';
import { Wallet } from '../exports';
import { getTagValue, parseContent } from './utils';
import { CardConfigPayload, CardDataPayload, CardPayload, CardsInfo, CardStatus, ConfigTypes } from '../types/Card';
import { LaWalletKinds } from '../constants/nostr';
import { Card } from '../class/Card';

export function cardsFilter(pubkey: string, cardPubkey: string) {
  return [
    {
      kinds: [LaWalletKinds.PARAMETRIZED_REPLACEABLE.valueOf() as NDKKind],
      '#d': [`${pubkey}:${ConfigTypes.DATA.valueOf()}`, `${pubkey}:${ConfigTypes.CONFIG.valueOf()}`],
      authors: [cardPubkey],
    },
  ];
}

export const buildCardConfigEvent = async (multiNip04Event: NostrEvent): Promise<NostrEvent> => {
  return {
    ...multiNip04Event,
    kind: LaWalletKinds.REGULAR,
    tags: multiNip04Event.tags.concat([['t', `${ConfigTypes.CONFIG.valueOf()}-change`]]),
  };
};

export function buildCardPayload(card: Card): CardPayload {
  const { name, description, status, limits } = card;

  return {
    name,
    description,
    status: status ? CardStatus.ENABLED : CardStatus.DISABLED,
    limits,
  };
}

export async function createCardConfigEvent(card: Card): Promise<NostrEvent | null> {
  if (!card.wallet || !card.wallet.pubkey) return null;

  let cardPayload = buildCardPayload(card);
  const encrypt = (pk: string, message: string) => extendedEncrypt(card.wallet.signer, pk, message);

  try {
    const receiverPubkeys: string[] = [card.wallet.federation.modulePubkeys.card, card.wallet.pubkey];
    const nip04Event: NostrEvent = await buildCardConfigEvent(
      await extendedMultiNip04Encrypt(
        JSON.stringify({ cards: { [card.uuid.toString()]: cardPayload } }),
        card.wallet.pubkey,
        receiverPubkeys,
        encrypt,
      ),
    );

    const signedEvent = await card.wallet.signEvent(nip04Event);
    return signedEvent;
  } catch {
    return null;
  }
}

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
