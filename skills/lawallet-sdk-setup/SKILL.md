---
name: lawallet-sdk-setup
description: >
  Install and wire up @lawallet/sdk — the nostr-first client and React hooks for
  LaWallet instances (lightning addresses, NWC wallets, LUD-16 payments, live
  events). Covers picking an entry point, mounting LaWalletProvider, signing in
  with a Nostr key, and choosing the right hook. Use when the user mentions
  "@lawallet/sdk", "LaWallet", "lawallet", "LaWalletProvider", or asks to add
  lightning addresses, nostr login, or a LaWallet wallet to their app. Also use
  when an import from @lawallet/sdk appears in a file being edited. Do NOT use
  for LNURL, NWC or nostr work that is not going through a LaWallet instance.
license: MIT
---

# Integrating @lawallet/sdk

A LaWallet instance is a server an operator runs at their own domain. This SDK
talks to that instance's REST API so a third-party app can offer its features —
give users a `name@their-domain` lightning address, connect wallets over NWC,
receive payments.

**Requires the instance to run v2.6.0 or newer** (older versions do not send the
cross-origin headers a browser app needs).

## 1. Install

```bash
npm install @lawallet/sdk
```

## 2. Pick the entry point

| Import                | Use when                                                                  |
| --------------------- | ------------------------------------------------------------------------- |
| `@lawallet/sdk`       | Node scripts, backends, or any non-React frontend                         |
| `@lawallet/sdk/react` | React apps. Re-exports everything from the core, so import from here only |

React is an optional peer dependency; importing the core from a backend does not
pull React in.

## 3. Auth model — read this before writing any auth code

There is **no login endpoint, no JWT, no session**. Every authenticated request
is a NIP-98 event signed by the user's Nostr key. Hand the client a signer and
it is authenticated; drop the signer and it is not.

Do not write token storage, refresh timers, or an auth API. They do not exist.

```typescript
import {
  LaWalletClient,
  nsecSigner,
  browserSigner,
  generateSigner
} from '@lawallet/sdk'

const wallet = new LaWalletClient({
  endpoint: 'https://wallet.example.com', // the instance's PUBLIC origin
  signer: nsecSigner(nsec) // or browserSigner() for NIP-07
})
```

`endpoint` must be the origin the instance is publicly reachable at — signatures
commit to it, so a proxy that rewrites the origin breaks authentication.

Signers are structural (`getPublicKey()` + `signEvent()`), so `window.nostr`,
nostr-tools, `@nostrify` and NDK signers all work without adapters.

## 4. React setup

```tsx
import { LaWalletProvider } from '@lawallet/sdk/react'

;<LaWalletProvider endpoint="https://wallet.example.com">
  <App />
</LaWalletProvider>
```

The provider fetches the instance's public settings (domain, branding, feature
flags), restores a remembered login, and keeps one SSE subscription alive that
refreshes the data hooks. No other setup.

## 5. Which hook

| Goal                                       | Hook                                                       |
| ------------------------------------------ | ---------------------------------------------------------- |
| Sign in / out, current npub                | `useAuth`                                                  |
| Current user, their primary address        | `useUser`                                                  |
| Instance branding, domain                  | `useInstanceInfo`                                          |
| Let a user claim an address (free or paid) | `useClaimAddress` — see the `lawallet-claim-address` skill |
| List / create addresses                    | `useAddresses`                                             |
| One address + routing (alias, NWC)         | `useAddress`                                               |
| Username availability as they type         | `useUsernameAvailability`                                  |
| Received payments, live                    | `useAddressInvoices`                                       |
| NWC wallet connections                     | `useRemoteWallets`                                         |
| Anything else, or your own endpoint        | `useLaWallet` / `useResource`                              |

## 6. Signing in

```tsx
const auth = useAuth()

auth.loginWithExtension() // NIP-07
auth.loginWithNsec(nsec, { remember: true }) // pasted key
const { nsec } = await auth.loginWithNewKey() // generated — show it ONCE for backup
auth.loginWithSigner(anySigner) // NIP-46 bunker, NDK, custom
```

A generated key **is** the account. Show it for backup before moving on, and put
that screen above the auth switch — the login screen unmounts the moment auth
succeeds.

## Rules

- Never build a JWT/session layer. The signer is the session.
- Never put an admin key in browser code — see the `lawallet-provision-address` skill.
- `useUser()`'s first authenticated fetch **creates** the account. That is signup.
- Errors are `LaWalletError` with `status`, `code`, `details` — branch on `status`, not message text.
