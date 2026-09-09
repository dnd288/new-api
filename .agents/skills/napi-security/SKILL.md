---
name: napi-security
description: >-
  Security surfaces, controls, and known gaps for new-api
---

# napi-security

## Surfaces

### 1. Authentication

- **JWT** — stateless tokens for API access. `middleware/auth.go`.
- **WebAuthn/Passkeys** — `service/passkey/`.
- **OAuth** — GitHub, Discord, OIDC, custom providers. `oauth/`.
- **Session** — cookie-based admin sessions.

**Controls:** Token validation in middleware. Password hashing. OAuth state parameter.
**Gaps:** Token revocation is not instant (JWT stateless). OAuth CSRF relies on state parameter.

### 2. API Keys (Tokens)

- User-created API keys for accessing the gateway.
- Stored hashed in the database.
- Rate-limited per token and per group.

**Controls:** Key hashing. Rate limiting. Group-based model access.
**Gaps:** Key rotation is manual. No automatic expiry by default.

### 3. Billing / Quota

- Quota is internal currency (integer). Overflow → negative charge → free credits.
- User-controlled multipliers: image `n`, video duration, resolution, batch counts.

**Controls:**
- `common/quota_math.go` — saturating conversions, no bare `int()`.
- `dto.MaxImageN`, `relaycommon.MaxTaskDurationSeconds`, `maxTokensLimit` — input bounds.
- `types.PriceData.AddOtherRatio` — rejects non-positive/NaN/+Inf ratios.
- Pre-consume fails on insufficient quota, never wraps.

**Invariant:** A billing path must never produce a negative charge. Trace: validation →
EstimateBilling → quota conversion → pre-consume → settle/refund.

### 4. Relay / Upstream

- Provider credentials (API keys, AWS credentials) stored in channel records.
- Relay adapters transform and forward requests.

**Controls:** Credentials stored server-side, never exposed to clients. Channel validation.
**Gaps:** Passthrough mode forwards as-is — validation is upstream's responsibility.

### 5. Database

- Three backends: SQLite, MySQL, PostgreSQL.
- GORM ORM with parameterized queries.

**Controls:** GORM prevents SQL injection in standard usage. `lockForUpdate(tx)` for row locks.
**Gaps:** Raw SQL in some paths — must account for dialect differences.

### 6. Frontend

- Admin dashboard embedded in Go binary.
- XSS prevention via React's default escaping.

**Controls:** CSP headers via `middleware/security_headers.go`. Input sanitization.
**Gaps:** User-generated content in channel names/descriptions.

## Rules

1. **Never commit credentials.** API keys, database passwords, provider tokens stay out of source.
   `.env` is gitignored. Guard checks scan for common patterns.
2. **Never log secrets.** Provider API keys, user tokens, full prompts.
3. **Bound all user-controlled quantities** before they reach quota calculation.
4. **Use `common/quota_math.go`** for all quota conversions — never bare casts.
5. **Validate input at the boundary** (controller/middleware), not deep in the service layer.
6. **Database code works on all three backends** — no dialect-specific code without fallbacks.
