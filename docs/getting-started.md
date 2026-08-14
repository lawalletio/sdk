# SDK Overview

Build your own webapp on top of your LaWallet instance — typed client, React hooks, nostr-first auth.

One package, two entry points, so anyone running a LaWallet instance can offer
its features from their own webapp (usually their own domain or subdomain):

- **`@lawallet/sdk`** — the typed, framework-free client. Works in the browser
  and in Node; its only runtime dependency is `nostr-tools`.
- **`@lawallet/sdk/react`** — a React provider and hooks built on that client.

They ship together and share one implementation, so a `LaWalletError` thrown by
the core is the same class the hooks re-throw. React is an **optional** peer
dependency: a Node backend importing `@lawallet/sdk` never pulls React in.

```bash
npm install @lawallet/sdk        # pnpm add / yarn add
```

Everything is **nostr-first**: there are no accounts, no passwords and no
session tokens. The user's Nostr key _is_ their identity — every authenticated
request is a [NIP-98](https://github.com/nostr-protocol/nips/blob/master/98.md)
event signed by that key. See [Authentication](./authentication.md).

## Quickstart

```typescript
import { LaWalletClient, nsecSigner } from '@lawallet/sdk'

const wallet = new LaWalletClient({
  endpoint: 'https://wallet.example.com', // your instance's PUBLIC origin
  signer: nsecSigner('nsec1...')
})

// Instance discovery — public, no signature involved
const settings = await wallet.settings.get()
console.log(settings.community_name, settings.domain)

// First authenticated call materialises the user for this npub
const me = await wallet.users.me()

// Claim a lightning address (throws a 402 LaWalletError in paid mode —
// or use wallet.registration.claimAddress() to handle payment for you)
await wallet.addresses.create({ username: 'satoshi' })
```

The same client works in Node — pass the instance URL and a signer, nothing
browser-specific is required. For live events in runtimes without a global
`EventSource`, inject one via the `EventSourceImpl` option.

## What the SDK covers

| Namespace       | Endpoints                                                                       |
| --------------- | ------------------------------------------------------------------------------- |
| `settings`      | Public instance settings — branding, domain, feature flags                      |
| `users`         | `me()` — fetches (and on first contact creates) the current user                |
| `addresses`     | List / get / create / update / remove / set-primary, invoices, availability     |
| `registration`  | Paid registration: invoice mint, LUD-21 verify, preimage claim, orchestration   |
| `remoteWallets` | NWC connections: CRUD, server-minted LNCurl wallets, connection string, balance |
| `lud16`         | Public payment endpoints: resolve, request invoice, LUD-21 verify               |
| `nip05`         | `/.well-known/nostr.json` lookups                                               |
| `events`        | SSE subscription — change notifications for live UIs                            |

Reads, writes, creation, updates and subscriptions all go through the same
per-request signing model; if the signer can sign, the client can act.

## Errors

Every non-2xx response throws a `LaWalletError` carrying the HTTP `status`,
the server's `code` and optional `details` — branch on those instead of
parsing messages:

```typescript
import { LaWalletError } from '@lawallet/sdk'

try {
  await wallet.addresses.create({ username: 'satoshi' })
} catch (error) {
  if (error instanceof LaWalletError && error.status === 402) {
    // Paid registration — see the registration flow guide
  }
}
```

## Cross-origin access

LaWallet instances serve their API with open CORS for exactly this use case:
your webapp on `app.your-domain.com` can call `wallet.your-domain.com`
directly from the browser. Authentication travels in the `Authorization`
header (or, for SSE, a signed query token) — no cookies are involved.

## Where next

- [Authentication](./authentication.md) — signers and the NIP-98 model
- [React hooks](./react.md) — the provider and every hook, with examples
- [Registration flow](./claim-flow.md) — the flagship onboarding + payment guide
- [Admin provisioning](./admin-provisioning.md) — issue reserved addresses when self-registration is closed
- [NWC & routing](./nwc.md) — remote wallets and address modes
