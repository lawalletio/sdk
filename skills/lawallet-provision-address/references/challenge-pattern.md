# Stateless proof-of-control challenges

The backend must hand out a nonce and later verify the answer. Keeping that
stateless avoids a table and survives restarts on any instance count.

```
challenge = `${expiresAt}.${pubkey}.${nonce}.${hmacSha256(secret, "exp.pubkey.nonce")}`
```

- `randomBytes(32).toString('base64url')` for the nonce.
- **Bind it to the target pubkey** and read that back out on verify, passing it
  as `expectedPubkey`. A challenge minted for npub A then cannot be answered by B.
- TTL 300s, matching the window `verifyChallengeEvent` allows on the event.
- Compare the HMAC with `timingSafeEqual`.

```typescript
import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto'

const sign = (secret: string, payload: string) =>
  createHmac('sha256', secret).update(payload).digest('base64url')

export function mintChallenge(pubkey: string, secret: string) {
  const expiresAt = Math.floor(Date.now() / 1000) + 300
  const nonce = randomBytes(32).toString('base64url')
  const payload = `${expiresAt}.${pubkey}.${nonce}`
  return {
    challenge: `${payload}.${sign(secret, payload)}`,
    nonce,
    expiresIn: 300
  }
}

export function openChallenge(challenge: string, secret: string) {
  const parts = challenge.split('.')
  if (parts.length !== 4) throw new Error('Malformed challenge')
  const [expiresAt, pubkey, nonce, mac] = parts
  const expected = Buffer.from(sign(secret, `${expiresAt}.${pubkey}.${nonce}`))
  const provided = Buffer.from(mac)
  if (
    provided.length !== expected.length ||
    !timingSafeEqual(provided, expected)
  ) {
    throw new Error('Challenge signature is invalid')
  }
  if (Number(expiresAt) < Math.floor(Date.now() / 1000))
    throw new Error('Challenge has expired')
  return { pubkey, nonce }
}
```

## Known ceiling

Not single-use: within the TTL the same proof can be replayed to provision a
_second_ address for the same, already-proven pubkey. If that matters, keep a
used-nonce `Set` (single process) or a table (multi-process). The trade-off is
deliberate — the same one LaWallet itself documents for its link challenges.
