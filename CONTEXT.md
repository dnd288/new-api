# Glossary

Terms that collide or mislead without context.

| Term | Means here | Not |
|------|-----------|-----|
| **Channel** | An upstream AI provider connection (OpenAI, Claude, Gemini, AWS Bedrock, etc.) with credentials, base URL, and model list | A chat room or communication channel |
| **Relay** | The proxy layer that adapts a client request to a provider's native format and streams the response back | A network relay or message broker |
| **Token** (API) | An API key issued to a user/group for authenticating requests against this gateway | A JWT, a session cookie, or an LLM token |
| **Token** (LLM) | A unit of text processed by a language model, used for billing and quota | An API key or auth credential |
| **Quota** | Internal billing currency (integer); provider costs are converted to quota via ratio/pricing expressions | A rate limit or concurrency cap |
| **Ratio** | The multiplier that converts upstream token cost into internal quota | A percentage or proportion |
| **Model** (data) | A GORM struct mapped to a database table (`model/`) | An AI/LLM model |
| **Model** (AI) | A specific LLM (e.g. `gpt-4o`, `claude-sonnet-4-20250514`) served through a channel | A database model |
| **Ability** | A mapping of which models a channel can serve, cached for routing | A user permission or capability |
| **Task** | An async generation job (Midjourney, Suno, video) polled to completion | A CI job or a to-do item |
| **Master node** | The instance elected to run background jobs (sync, scheduled tasks) in multi-node deployments | A git branch or a primary database |
| **Group** | A user group with its own quota pool, rate limits, and model access rules | A chat group or an org team |
| **Setup** | The first-run wizard that creates the root admin account and initial configuration | Local development environment setup |
| **Option** | A runtime configuration value stored in the `options` table, hot-reloaded | A CLI flag or a function parameter |
| **Agent** | Not used in this codebase in any AI-agent sense | — |
| **Frontend** | The React 19 + Rsbuild admin dashboard embedded in the Go binary at build time | A customer-facing website |
| **relaykit** | An independently-buildable Go submodule under `relaykit/` for relay conversion utilities | The main relay package |
