# @lawallet/sdk

SDK for LaWallet

## To - do

- [x] Project startup (Linters, Typescript, Dependencies)
- [x] Federation
- [x] Identity
  - [x] Pubkey info
  - [x] Lightning Info
  - [x] Nostr Profile
- [ ] Wallet
  - [x] Signer + Identity
  - [ ] Wallet Information
    - [x] getBalance
    - [x] getTransactions
    - [ ] getCards
  - [ ] onReceiveTransaction()
  - [ ] createInvoice / createZap
  - [x] signEvent
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

## Installation

```bash
pnpm add @lawallet/sdk
```

## Documentation

For documentation and guides, visit [sdk.lawallet.io](https://sdk.lawallet.io).
