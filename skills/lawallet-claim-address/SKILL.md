---
name: lawallet-claim-address
description: >
  Build the flow where a user claims their own lightning address on a LaWallet
  instance with @lawallet/sdk — username availability, the operator's paid
  registration path (invoice QR, WebLN, LUD-21 settlement polling,
  resume-after-refresh) and the claim itself, via useClaimAddress or
  registration.claimAddress. Use when the user asks to let people "claim",
  "register", "buy" or "sign up for" a lightning address or username, mentions
  useClaimAddress, or hits a 402 from POST /api/wallet/addresses. Do NOT use
  when an operator issues addresses on someone else's behalf — that is the
  lawallet-provision-address skill.
license: MIT
---

# Claiming a lightning address

A visitor picks a name and ends up owning `name@instance-domain`, bound to their
npub. The instance decides whether that costs sats; the same client code covers
both cases.

## The shape of it

1. `POST /api/wallet/addresses` — succeeds on a free instance.
2. On a paid instance it answers **402**. Mint an invoice, show the bolt11 as a
   QR, and poll its LUD-21 `verify` URL until it reports `{ settled, preimage }`.
3. Claim with that preimage. The server checks `sha256(preimage) === paymentHash`
   and creates the address in the same transaction.

No webhooks, and the preimage never requires trusting the payer's wallet — the
verifier only hands it out after settlement.

## React: use the hook, do not rebuild it

```tsx
import { useClaimAddress } from '@lawallet/sdk/react'
import { QRCodeSVG } from 'qrcode.react'

function ClaimScreen() {
  const flow = useClaimAddress({ onCreated: address => console.log(address) })

  if (flow.step === 'payment' && flow.invoice) {
    return (
      <>
        <h2>
          Pay {flow.invoice.amountSats} sats for {flow.username}@{flow.domain}
        </h2>
        <QRCodeSVG value={flow.invoice.bolt11.toUpperCase()} size={240} />
        {flow.hasWebLn && (
          <button
            onClick={flow.handleWebLnPay}
            disabled={flow.payingWithWallet}
          >
            Pay with extension
          </button>
        )}
        <button onClick={flow.handleManualCheck} disabled={flow.manualChecking}>
          I paid — check now
        </button>
        <button onClick={flow.backFromPayment}>Cancel</button>
        {flow.paymentStatus === 'expired' && (
          <p>Invoice expired — start over.</p>
        )}
      </>
    )
  }

  if (flow.step === 'success') return <h2>⚡ {flow.claimedAddress}</h2>

  return (
    <form onSubmit={flow.handleSubmit}>
      <input
        value={flow.username}
        onChange={e => flow.setUsername(e.target.value.toLowerCase())}
      />
      <small>
        {flow.formatError ??
          (flow.checking ? 'Checking…' : flow.available ? 'Available ✓' : '')}
      </small>
      <button disabled={flow.submitDisabled}>
        {flow.submitting ? 'Claiming…' : 'Claim'}
      </button>
      {flow.error && <p role="alert">{flow.error}</p>}
    </form>
  )
}
```

The hook already handles: debounced availability, the 402 branch, LUD-21 polling
for the invoice's whole lifetime, a manual re-check, the WebLN one-click path,
`sessionStorage` resume so a refresh mid-payment does not strand someone who
already paid, double-claim race guards, and cache invalidation on success.

Render its state. Do not reimplement any of that.

## Outside React

```typescript
const result = await wallet.registration.claimAddress({
  username: 'satoshi',
  onInvoice: invoice => renderQr(invoice.bolt11) // only called when it costs
})
// { lightningAddress: 'satoshi@wallet.example.com', paid: true }
```

Resolves when the address exists. Pass an `AbortSignal` to cancel.

## Constraints that bite

- Usernames are `^[a-z0-9]{1,16}$` and **create-only** — there is no rename. The
  equivalent is create-new + `setPrimary` + delete the old one.
- The user must be signed in first: the address binds to the authenticated npub.
- A half-configured paid instance surfaces as `LaWalletError` with code
  `PAID_REGISTRATION_INCOMPLETE`. Show it; do not retry in a loop.
- An already-claimed invoice is success, not an error — a lost response must not
  strand a paying user. `claimAddress` and the hook both do this already.
- Registration can be closed entirely (403). Then the operator must issue the
  address — see the `lawallet-provision-address` skill.

## Working example

[`examples/example-onboarding`](../../examples/example-onboarding) is this flow end
to end: branding, nostr login, claim, then alias/NWC setup.
