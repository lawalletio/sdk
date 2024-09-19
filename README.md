# @lawallet/sdk

SDK for LaWallet

## Installation

```bash
pnpm add @lawallet/sdk
```

## Usage examples

### Fetch

```ts
import { Wallet, createSigner } from '@lawallet/sdk';

const Alice = new Wallet({ signer: createSigner("ALICE_SECRET_KEY") });
const Bob = new Wallet({ signer: createSigner("BOB_SECRET_KEY) });

Alice.fetch().then(({ lnurlpData, nostr }) => {
  // returns lnurlpData -> /.well-known/lnurlp/<user> response
  console.log('lnurlpData: ', lnurlpData);

  // returns nostr profile
  console.log('Nostr Profile: ', nostr);
});
```

### getBalance

```ts
// Returns BTC balance in millisatoshis
Alice.getBalance('BTC').then((bal) => {
  console.log(`Account BTC Balance: ${bal} milisatoshis ~ ${(bal / 100000000).toFixed(8)} BTC`);
});
```

### getTransactions

```ts
// Returns all transactions
Alice.getTransactions().then((transactions) => {
  console.log('Total account transactions: ', transactions.length);
});
```

### Cards

```ts
Alice.addCard('CARD_NONCE');

Alice.getCards().then(async (cards) => {
  if (cards.length) {
    // Get first card
    let firstCard = cards[0];

    // Pause first card
    await firstCard.disable();

    // Add card limit -> 1000 satoshis every 12 hours
    await firstCard.addLimit({
      tokenId: 'BTC',
      limitType: 'hours',
      limitTime: 12,
      limitAmount: 1000000,
    });

    // Set card metadata (name, description)
    await firstCard.setMetadata({ name: 'card name', description: 'card description' });

    // Prepare the event to transfer the card
    const transferEvent = await firstCard.createTransferEvent();

    // Claim card with another account
    await Bob.claimCardTransfer(transferEvent);
  }
});
```

### Payments

```ts
Alice.generateInvoice({ milisatoshis: 1000 }).then((invoice) => {
  // Generate payment request of this wallet
  console.log(invoice.pr);
});

Alice.createZap({ milisatoshis: 1000, receiverPubkey: Bob.pubkey }).then((invoice) => {
  // Generate zap request -> returns payment request of zap request
  const { pr: paymentRequest } = invoice;

  // Pay invoice
  Alice.payInvoice({
    paymentRequest,
    onSuccess: () => {
      console.log('Invoice paid successfully');
    },
  });
});

// Send transaction
Alice.sendTransaction({
  tokenId: 'BTC',
  receiver: 'cuervo@lawallet.ar',
  amount: 1000,
  comment: 'Hello!',
  onSuccess: () => {
    console.log('Transaction successfully sent');
  },
  onError: () => {
    console.log('An error occurred with the transaction');
  },
});

// Send internal transaction
Alice.sendInternalTransaction({
  tokenId: 'BTC',
  receiver: 'USER_HEX_PUBKEY',
  amount: 1000,
  comment: 'Hello!',
  onSuccess: () => {
    console.log('Transaction successfully sent');
  },
  onError: () => {
    console.log('An error occurred with the transaction');
  },
});
```

## To - do

- [x] Project startup (Linters, Typescript, Dependencies)
- [x] Federation
- [x] Identity
  - [x] Pubkey info
  - [x] Lightning Info
  - [x] Nostr Profile
- [x] Card
  - [x] info (design, name, description)
  - [x] limits
  - [x] enable/disable
  - [x] setMetadata
  - [x] addLimit
  - [x] restartLimits
  - [x] replaceLimits
  - [x] createTransferEvent
- [x] Wallet
  - [x] Signer + Identity
  - [x] Wallet Information
    - [x] getBalance
    - [x] getTransactions
    - [x] getCards
  - [x] signEvent
  - [x] createZap
  - [x] createInvoice
  - [x] sendTransaction
    - [x] send internal / lud16 / lnurl transfer
    - [x] onSuccess()
    - [x] onError()
  - [x] payInvoice
  - [x] claimCardTransfer
  - [x] addCard / activateCard
  - [x] registerHandle (request + payment + claim)

- [ ] Tests coverage
  - [ ] Federation
  - [ ] Identity
  - [ ] Wallet
