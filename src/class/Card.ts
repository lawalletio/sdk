import { Wallet } from '../exports';
import { createCardConfigEvent } from '../lib/cards';
import type { Limit, CardPayload, Design } from '../types/Card';

interface CardData {
  uuid: string;
  design: Design;
  name: string;
  description: string;
  status: boolean;
  limits: Limit[];
}

export class Card {
  private _wallet: Wallet;
  private _cardData: CardData;

  constructor(wallet: Wallet, uuid: string, cardDesign: Design, cardConfig: CardPayload) {
    const { name, description, status, limits } = cardConfig;
    this._wallet = wallet;

    this._cardData = {
      uuid,
      design: cardDesign,
      name,
      description,
      status: Boolean(cardConfig.status === 'ENABLED'),
      limits: cardConfig.limits,
    };
  }

  async enable() {
    if (this.isEnabled()) throw new Error('The card is already enabled');

    this.status = true;

    let cardConfigEvent = await createCardConfigEvent(this);
    if (!cardConfigEvent) {
      this.status = false;
      return false;
    }

    return this._wallet.federation.httpPublish(cardConfigEvent);
  }

  async disable() {
    if (!this.isEnabled()) throw new Error('The card is already disabled');

    this.status = false;

    let cardConfigEvent = await createCardConfigEvent(this);
    if (!cardConfigEvent) {
      this.status = true;
      return false;
    }

    return this._wallet.federation.httpPublish(cardConfigEvent);
  }

  isEnabled() {
    return this.enable;
  }

  get wallet() {
    return this._wallet;
  }

  get uuid() {
    return this._cardData.uuid;
  }

  get design() {
    return this._cardData.design;
  }

  get name() {
    return this._cardData.name;
  }

  get description() {
    return this._cardData.description;
  }

  get status() {
    return this._cardData.status;
  }

  set status(new_status: boolean) {
    this._cardData.status = new_status;
  }

  get limits(): Limit[] {
    if (!this._cardData.limits) return [];
    return this._cardData.limits;
  }
}
