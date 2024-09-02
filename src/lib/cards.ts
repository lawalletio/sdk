import { NDKEvent, NDKKind, NDKPrivateKeySigner, NostrEvent } from '@nostr-dev-kit/ndk';
import { EventTemplate, finalizeEvent, getEventHash, getPublicKey, nip26, UnsignedEvent } from 'nostr-tools';
import { Card } from '../class/Card.js';
import { Federation } from '../class/Federation.js';
import { Wallet } from '../class/Wallet.js';
import { LaWalletKinds, LaWalletTags } from '../constants/nostr.js';
import {
  CardConfigPayload,
  CardDataPayload,
  CardLimitTypes,
  CardPayload,
  CardsInfo,
  CardStatus,
  ConfigTypes,
} from '../types/Card.js';
import { extendedDecrypt, extendedEncrypt, extendedMultiNip04Decrypt, extendedMultiNip04Encrypt } from './nip04.js';
import { getTagValue, nowInSeconds, parseContent } from './utils.js';
import { Api } from './api.js';
import { hexToBytes } from '@noble/hashes/utils';

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
  const { name, description, enabled, limits } = card;

  return {
    name,
    description,
    status: enabled ? CardStatus.ENABLED : CardStatus.DISABLED,
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

export function calculateDelta(limitType: CardLimitTypes, limitTime: number): number {
  if (limitType === 'transaction') return 0;

  if (limitTime <= 0) throw new Error(`You can't calculate the delta of ${limitTime} ${limitType}`);

  const timeMultipliers: { [key in typeof limitType]: number } = {
    seconds: 1,
    minutes: 60,
    hours: 3600,
    days: 86400,
    weeks: 604800,
    months: 2592000,
    years: 31536000,
  };

  const delta = timeMultipliers[limitType] * limitTime;
  return delta;
}

export const buildCardTransferDonationEvent = async (pubkey: string, uuidNip04: string, cardPubkey: string) => {
  const expiry: number = nowInSeconds() + 3600;
  const event: NostrEvent = {
    kind: LaWalletKinds.EPHEMERAL,
    pubkey,
    content: uuidNip04,
    created_at: nowInSeconds(),
    tags: [
      ['t', LaWalletTags.CARD_TRANSFER_DONATION],
      ['p', cardPubkey],
      ['expiry', expiry.toString()],
    ],
  };

  return event;
};

export async function buildDonationEvent(card: Card): Promise<NostrEvent | undefined> {
  try {
    if (!card.wallet.pubkey) return;
    const encryptedUUID: string | undefined = await extendedEncrypt(
      card.wallet.signer,
      card.wallet.federation.modulePubkeys.card,
      card.uuid,
    );
    if (!encryptedUUID) return;

    const transferDonationEvent = await buildCardTransferDonationEvent(
      card.wallet.pubkey,
      encryptedUUID,
      card.wallet.federation.modulePubkeys.card,
    );

    const signedEvent: NostrEvent = await card.wallet.signEvent(transferDonationEvent);

    return signedEvent;
  } catch {
    return;
  }
}

export const buildCardTransferAcceptEvent = async (
  giverPubkey: string,
  donationEvent: NostrEvent,
  privateKey: string,
  federation: Federation = new Federation(),
) => {
  const delegation = nip26.createDelegation(privateKey, {
    pubkey: federation.modulePubkeys.card,
    kind: LaWalletKinds.REGULAR,
    since: Math.floor(Date.now() / 1000) - 36000,
    until: Math.floor(Date.now() / 1000) + 3600 * 24 * 30 * 12,
  });

  const event: EventTemplate = {
    kind: LaWalletKinds.EPHEMERAL,
    content: JSON.stringify({
      delegation: {
        conditions: delegation.cond,
        token: delegation.sig,
      },
      donationEvent,
    }),
    created_at: nowInSeconds(),
    tags: [
      ['t', LaWalletTags.CARD_TRANSFER_ACCEPTANCE],
      ['p', federation.modulePubkeys.card],
      ['p', giverPubkey],
    ],
  };

  return finalizeEvent(event, hexToBytes(privateKey));
};

export const buildCardActivationEvent = async (
  otc: string,
  privateKey: string,
  federation: Federation = new Federation(),
): Promise<NostrEvent> => {
  const signer = new NDKPrivateKeySigner(privateKey);
  const userPubkey: string = getPublicKey(hexToBytes(privateKey));

  const delegation = nip26.createDelegation(privateKey, {
    pubkey: federation.modulePubkeys.card,
    kind: LaWalletKinds.REGULAR,
    since: Math.floor(Date.now() / 1000) - 36000,
    until: Math.floor(Date.now() / 1000) + 3600 * 24 * 30 * 12,
  });

  const event: NDKEvent = new NDKEvent();
  event.pubkey = userPubkey;
  event.kind = LaWalletKinds.EPHEMERAL;

  event.content = JSON.stringify({
    otc,
    delegation: {
      conditions: delegation.cond,
      token: delegation.sig,
    },
  });

  event.tags = [
    ['p', federation.modulePubkeys.card],
    ['t', LaWalletTags.CARD_ACTIVATION_REQUEST],
  ];

  await event.sign(signer);
  return event.toNostrEvent();
};

export async function activateCard(event: NostrEvent, federation: Federation = new Federation()) {
  const api = Api();
  const response = await api.post(`${federation.apiGateway}/card`, { body: JSON.stringify(event) }, false);

  return response.status >= 200 && response.status < 300;
}
