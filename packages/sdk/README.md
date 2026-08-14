# @lawallet/sdk

Nostr-first TypeScript client and React hooks for [LaWallet](https://lawallet.io)
instances — lightning addresses, NWC wallets, LUD-16 payments and live events.

```bash
npm install @lawallet/sdk
```

## Two entry points

```typescript
import { LaWalletClient, nsecSigner } from '@lawallet/sdk' // browser + Node
import { LaWalletProvider, useClaimAddress } from '@lawallet/sdk/react'
```

React is an **optional** peer dependency, so importing the core from a Node
backend never pulls React in. Both entries share one implementation.

## Core

```typescript
const wallet = new LaWalletClient({
  endpoint: 'https://wallet.example.com',
  signer: nsecSigner(process.env.NSEC!)
})

const me = await wallet.users.me() // creates the account on first call
await wallet.addresses.create({ username: 'satoshi' })
```

Namespaces: `settings`, `users`, `addresses`, `registration`, `remoteWallets`,
`lud16`, `nip05`, `events`. Errors throw `LaWalletError` with `status`, `code`
and `details`.

## React

```tsx
<LaWalletProvider endpoint="https://wallet.example.com">
  <App />
</LaWalletProvider>
```

`useAuth`, `useUser`, `useAddresses`, `useAddress`, `useClaimAddress`,
`useUsernameAvailability`, `useAddressInvoices`, `useRemoteWallets`,
`useInstanceInfo`, `useResource`, `useSSEConnected`, `useLaWallet`.

## Authentication

Every authenticated request is a kind-27235 NIP-98 event signed by the user's
key. No login endpoint and no session to refresh — the signer is the session.
Any structural signer works: `window.nostr` (NIP-07), nostr-tools, `@nostrify`,
NDK.

## Docs and examples

Full documentation, two runnable example apps and agent skills live in the
repository: **https://github.com/lawalletio/sdk**

Requires a LaWallet instance running v2.6.0 or newer.

MIT
