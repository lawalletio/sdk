# LaWallet SDK

Nostr-first TypeScript client and React hooks for [LaWallet](https://lawallet.io)
instances. Give your users a lightning address on your own domain, connect their
wallets over NWC, and take payments — from your own webapp.

```bash
npm install @lawallet/sdk
```

```tsx
import { LaWalletProvider, useClaimAddress } from '@lawallet/sdk/react'

function App() {
  return (
    <LaWalletProvider endpoint="https://wallet.example.com">
      <Claim />
    </LaWalletProvider>
  )
}

function Claim() {
  const flow = useClaimAddress()
  return (
    <form onSubmit={flow.handleSubmit}>
      <input
        value={flow.username}
        onChange={e => flow.setUsername(e.target.value)}
      />
      <button disabled={flow.submitDisabled}>
        Claim {flow.username}@{flow.domain}
      </button>
    </form>
  )
}
```

That form handles username availability, the operator's paid-registration path
(invoice QR, WebLN, LUD-21 settlement polling, resume-after-refresh) and the
claim itself. There is no login step to build: the user's Nostr key is the
session.

## Two entry points

| Import                | What it is                                                              | Runs in        |
| --------------------- | ----------------------------------------------------------------------- | -------------- |
| `@lawallet/sdk`       | Typed client for the whole REST API. Only runtime dep is `nostr-tools`. | Browser + Node |
| `@lawallet/sdk/react` | Provider + 12 hooks over that client. Re-exports everything above.      | React 18+      |

React is an **optional** peer dependency — a Node backend importing
`@lawallet/sdk` never pulls React into its dependency graph. Both entries share
one implementation, so errors and classes are identical across them.

## Nostr-first auth

Every authenticated request is a kind-27235 [NIP-98](https://github.com/nostr-protocol/nips/blob/master/98.md)
event signed by the user's key, committing to the URL, method and body. No
login endpoint, no session state, nothing to refresh — hand the client a signer
and start calling. Signers are structural (`getPublicKey` + `signEvent`), so
`window.nostr` (NIP-07), nostr-tools, `@nostrify` and NDK signers all work as-is.

## Examples

| Example                                                             | Shows                                                                                                                                                                   |
| ------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [`example-onboarding`](examples/example-onboarding)                 | A visitor claims their own address — nostr login, availability, the paid lightning path, then alias/NWC setup                                                           |
| [`example-admin-provisioning`](examples/example-admin-provisioning) | The operator issues reserved addresses for instances with self-service registration closed: proof-of-npub, an admin-authenticated backend, then the owner takes control |

Both run with no configuration against the public instance:

```bash
pnpm install && pnpm build
pnpm --filter lawallet-example-onboarding dev
```

## Docs

- [Getting started](docs/getting-started.md) — install, quickstart, API coverage
- [Authentication](docs/authentication.md) — signers, NIP-98, key custody
- [React hooks](docs/react.md) — the provider and every hook, with examples
- [Claim flow](docs/claim-flow.md) — free and paid address registration
- [Admin provisioning](docs/admin-provisioning.md) — issuing addresses on a user's behalf
- [NWC & routing](docs/nwc.md) — remote wallets and the four address modes

## Agent skills

The repo ships [Claude Code skills](skills/) so an AI assistant integrates the
SDK correctly instead of guessing at the API:

```
/plugin marketplace add lawalletio/sdk
/plugin install lawallet-sdk@lawallet-sdk
```

| Skill                        | Use it for                                                          |
| ---------------------------- | ------------------------------------------------------------------- |
| `lawallet-sdk-setup`         | Installing, wiring the provider, choosing an entry point and a hook |
| `lawallet-claim-address`     | Building a flow where users claim their own address, paid or free   |
| `lawallet-provision-address` | Issuing addresses operator-side, with proof of key ownership        |

## Requirements

A LaWallet instance running **v2.6.0 or newer** — that release added the
cross-origin access this SDK needs, the NIP-98 SSE token and the operator
provisioning endpoint.

## Contributing

```bash
pnpm install
pnpm build        # required once: the examples consume packages/sdk/dist
pnpm test
pnpm typecheck
```

MIT © La Crypta
