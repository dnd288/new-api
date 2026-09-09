# Security

Surfaces, controls, and known gaps for new-api. See `napi-security` skill for the full reference.

## Surfaces

| Surface | Control | Known Gap |
|---------|---------|-----------|
| Authentication (JWT, WebAuthn, OAuth) | Token validation middleware, password hashing, OAuth state | JWT revocation is not instant (stateless) |
| API Keys | Hashed storage, rate limiting, group-based access | Manual rotation, no automatic expiry |
| Billing / Quota | `quota_math.go` saturating conversions, input bounds, ratio guards | Passthrough fields may bypass validation |
| Relay / Upstream | Server-side credential storage, channel validation | Pass-through mode relies on upstream validation |
| Database | GORM parameterized queries, `lockForUpdate(tx)` | Raw SQL in some paths needs dialect care |
| Frontend | React XSS escaping, CSP headers | User-generated content in names/descriptions |

## Rules

1. Never commit credentials.
2. Never log secrets (tokens, API keys, full prompts).
3. Bound all user-controlled quantities before quota calculation.
4. Use `common/quota_math.go` for all conversions.
5. Validate input at the boundary (controller/middleware).
6. Database code works on all three backends.
