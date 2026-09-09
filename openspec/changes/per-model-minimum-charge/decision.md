# Decision: Apply a flat per-model quota floor
## Context
A model-level opt-in minimum is needed. The initial piecewise surcharge proposal would make a 21-quota request cost 26 while a 20-quota request costs 20, and clients could avoid the surcharge by splitting requests.
## Decision
Store a per-model boolean pricing option. When enabled, transform a positive final request charge with `max(10, quota)`. Apply the same transform to pre-consume and final settlement, and snapshot it for asynchronous tasks.
## Rationale
A monotonic floor is predictable, has no threshold jump, and performs no unsafe arithmetic. A model pricing option keeps the billing contract visible and administrator-controlled instead of introducing a global hidden rule. This follows AGENTS.md requirements for billing safety, clean configuration cutover, and server-side enforcement.
## Alternatives
### Piecewise surcharge above 20
Keeps the original proposal but creates a six-quota jump from 20 to 21 and encourages request splitting.
### Encode the floor inside every billing expression
Keeps expression pricing self-contained but excludes legacy ratio pricing, duplicates policy syntax across models, and makes a simple checkbox difficult to apply consistently to every billing mode.
### Global settlement rule
Simple implementation but silently changes every model and conflicts with the requested per-model control.
## Consequences
All billing modes share one visible opt-in policy. Pre-consume may reserve 10 quota even when the estimate is smaller. Zero-cost and failed requests remain free/refunded. Async task metadata gains an optional boolean without a database migration.
## Reversibility
Removing the option and transform restores prior behavior. Existing false or absent values require no migration; true values can be deleted from the existing option map.
## Status
Accepted.
