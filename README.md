# @lawallet/sdk

SDK for LaWallet

## Important

This package is under development and is not yet available on npm.

## Installation

```bash
pnpm add @lawallet/sdk @nostr-dev-kit/ndk
```

## Usage

```ts
import { NDKPrivateKeySigner } from '@nostr-dev-kit/ndk';
import { Wallet } from '@lawallet/sdk';

const signer = NDKPrivateKeySigner.generate();
const wallet = new Wallet({ signer });

const balance = await wallet.getBalance('BTC'); // Returns BTC balance in millisatoshis
const transactions = await wallet.getTransactions(); // Returns all transactions

const cards = await wallet.getCards(); // Returns the information and configuration of the wallet cards
```

## To - do

- [x] Project startup (Linters, Typescript, Dependencies)
- [x] Federation
- [x] Identity
  - [x] Pubkey info
  - [x] Lightning Info
  - [x] Nostr Profile
- [ ] Wallet
  - [x] Signer + Identity
  - [x] Wallet Information
    - [x] getBalance
    - [x] getTransactions
    - [x] getCards
  - [x] signEvent
  - [ ] createInvoice / createZap
  - [ ] prepareTransaction (external / internal)
  - [ ] sendTransaction
    - [ ] onSuccess()
    - [ ] onError()
  - [ ] registerHandle (request + payment + claim)
- [ ] Client
  - [ ] Multiples accounts
    - [ ] accounts
    - [ ] addAccount
    - [ ] removeAccount
  - [ ] Watch transactions
  - [ ] Create event filter
  - [ ] get Transaction (txId)
