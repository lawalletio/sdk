import WebSocket from 'ws';

export { Federation } from '../class/Federation.js';
export { Identity } from '../class/Identity.js';
export { Wallet } from '../class/Wallet.js';

export { createFederationConfig } from '../lib/createFederationConfig.js';

Object.assign(global, { WebSocket });
