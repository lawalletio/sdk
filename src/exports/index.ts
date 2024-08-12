Object.assign(global, { WebSocket: require('ws') });

export { Federation } from '../class/Federation';
export { Identity } from '../class/Identity';
export { Wallet } from '../class/Wallet';
export { Client } from '../class/Client';

export { createFederationConfig } from '../lib/createFederationConfig';
