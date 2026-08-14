---
name: lawallet-provision-address
description: >
  Issue lightning addresses on a user's behalf from an operator backend with
  @lawallet/sdk — for LaWallet instances where self-service registration is
  switched off and the operator hands out reserved names. Covers proving the
  user controls their npub with a signed challenge, addresses.provision(), both
  admin auth modes (per-request NIP-98 or a cached session JWT), and keeping the
  admin key out of browser code. Use when the user says "reserved", "invite
  only", "admin creates the address", "provision", "on behalf of", or when
  self-registration returns 403. Do NOT use when users claim their own address —
  that is the lawallet-claim-address skill.
license: MIT
---

# Provisioning addresses as the operator

For instances with **Settings → Lightning Address → User Registration** off:
users cannot create their own address, and the operator issues reserved names
through their own process — membership, vetting, an off-platform payment.

Two things have to be true, and the order matters:

1. The visitor **proves** they hold the npub (otherwise anyone reserves a name
   against someone else's key).
2. Only then does the backend spend its **admin credential** to create it.

## Architecture — non-negotiable

```
browser                        your backend                 LaWallet instance
  signer (visitor's key)  ──►  verifies the proof     ──►   POST /api/lightning-addresses
  NO admin key                 holds the admin key           (needs addresses:write)
```

The admin key must never reach the browser. Read it from an env var your bundler
will not inline — in Vite, only `VITE_`-prefixed variables reach client code, so
name it `LAWALLET_ADMIN_NSEC` and the leak is structurally impossible. Give the
browser a client with no signer and no token; it can still read public endpoints.

## 1. Prove key control

```typescript
// browser
import { signChallengeEvent } from '@lawallet/sdk'
const event = await signChallengeEvent(nonce, signer)
```

```typescript
// backend
import { verifyChallengeEvent } from '@lawallet/sdk'
const pubkey = verifyChallengeEvent(event, nonce, expectedPubkey)
```

`verifyChallengeEvent` checks the kind (22242, NIP-42), that the `challenge` tag
answers your nonce, a ±300s window, the Schnorr signature, and the expected key.
Failures throw `LaWalletError` with an HTTP-shaped `status` and a `code` like
`PROOF_STALE` or `PROOF_BAD_SIGNATURE`, so you can map them onto a response.

Issuing the nonce is yours to design. A stateless HMAC carrying expiry + the
target pubkey needs no database — see `references/challenge-pattern.md`.

## 2. Authenticate as the operator

```typescript
import { LaWalletClient, nsecSigner } from '@lawallet/sdk'

// NIP-98: signs every request. Works on every endpoint.
const admin = new LaWalletClient({
  endpoint,
  signer: nsecSigner(process.env.LAWALLET_ADMIN_NSEC!)
})

// or a session JWT: mint ONCE, reuse. /api/jwt is rate limited to 10/min per IP.
const { token } = await admin.auth.mintJwt('12h')
const viaJwt = new LaWalletClient({ endpoint, token }) // no signer — it would take precedence
```

Both are real admin credentials: the API re-resolves the role from its database
on every request rather than trusting a claim in the token.

## 3. Provision

```typescript
const address = await admin.addresses.provision({
  username: 'reserved',
  pubkey
})
```

Requires `addresses:write` (ADMIN or OPERATOR). It creates the target account on
demand — a pubkey the instance has never seen can be handed a name — and
bypasses the self-service registration policy, which is the whole point.

Pubkeys go over the wire as hex; `toPubkey()` accepts an npub or hex and throws
on anything else, so it doubles as validation.

## 4. Hand it over

Creating the address needs an operator; **managing it does not**. Afterwards the
owner's own key sets an alias, binds an NWC wallet, or clears routing — and that
keeps working with registration switched off, because the toggle gates creating
addresses, not managing your own.

## Rules

- Verify the proof **before** spending the admin credential, never after.
- Mint the JWT once per process; a per-request mint passes local tests and dies
  on the rate limit in production.
- Rate-limit your own challenge endpoint. A proof is free for keys the visitor
  holds, so put your real criterion (invite code, paid order, allowlist) in front.
- The instance's clock matters: NIP-98 allows ±60s, the proof event ±300s.
- `addresses.listAll()` (needs `addresses:read`) audits what you have issued.

## Working example

[`examples/example-admin-provisioning`](../../examples/example-admin-provisioning)
implements all of this, backend included.
