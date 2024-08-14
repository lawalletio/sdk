import { Wallet } from '../exports';
import { createCardConfigEvent } from '../lib/cards';
import type { Limit, CardPayload, Design } from '../types/Card';

export class Card {
  private _wallet: Wallet;
  uuid: string;
  design: Design;
  name: string;
  description: string;
  status: boolean;
  limits: Limit[];

  constructor(wallet: Wallet, uuid: string, cardDesign: Design, cardConfig: CardPayload) {
    this._wallet = wallet;
    this.uuid = uuid;
    this.design = cardDesign;
    this.name = cardConfig.name;
    this.description = cardConfig.description;
    this.status = Boolean(cardConfig.status === 'ENABLED');
    this.limits = cardConfig.limits;
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

  getLimits(): Limit[] {
    return this.limits;
  }

  get wallet() {
    return this._wallet;
  }
}
