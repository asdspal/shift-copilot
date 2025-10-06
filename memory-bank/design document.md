### ShiftCopilot — FAANG‑Level Design Document (Production-Focused)

#### 1. Executive Summary
ShiftCopilot is an AI-driven, non-custodial, cross-chain portfolio autopilot with a Telegram control plane. It optimizes user allocations and yield across Ethereum L2s using a Smart Account (Safe AA + EIP‑4337), executes cross-chain swaps via SideShift, and prevents transaction failures with an automatic gas-refuel "Gas Ghost" on Base. The AI Copilot uses rule-based intent parsing for Wave 1 (local LLM deferred to later waves), simulating plans and executing within policy windows without requiring approval for low-risk, bounded actions. Production priorities: safety (session key limits, policy guardrails), transparency (fees, receipts to IPFS), reliability (99.5% availability), and SideShift‑aligned compliance.

Key constraints from stakeholders:
- Users: Individual DeFi users; each user receives their own dedicated Safe AA
- Regions/compliance: Same as SideShift
- Chains (initial): Ethereum L2s with MVP on Base (Arbitrum next)
- Assets: ETH, USDC, USDT (Wave 1); additional assets in future waves
- Gas Ghost: Base only; threshold 0.05 ETH; daily budget $100 (shared with all operations); funding priority USDC > USDT > ETH
- Telegram: Command/control only (no P2P tipping in MVP/production)
- Intent Parsing: Rule-based (regex) for Wave 1; local LLM in Wave 2+
- Receipts: Self-hosted IPFS
- Data retention: 30 days
- SLOs: 2s Telegram ack, 5s swap initiation
- Availability: 99.5%
- Throughput: DAU/actions TBD (plan for bursty hackathon traffic)
- SideShift Integration: Polling-first for Wave 1; webhooks as Wave 2+ enhancement

#### 2. Goals and Non‑Goals
- Goals
  - Non-custodial, safe, cross-chain execution with clear controls and receipts.
  - Chain-abstracted UX: conversational intents → simulated plan → execution.
  - Autonomous, bounded actions (auto-refuel on Base; small rebalances within policy).
  - Explicit fee transparency (SideShift + gas) pre-execution.
  - Production-ready architecture with clear MVP subset for Wave 1 (Telegram bot + Gas Ghost + basic rebalance).

- Non‑Goals
  - P2P tipping/airdrops in Telegram (future).
  - KYC/AML beyond SideShift's policies (adhere to SideShift stance).
  - Native mobile app (Telegram-first; optional web status page later).
  - Yield strategy marketplace at launch (start with Aave v3 only).
  - Natural language LLM parsing in Wave 1 (deferred to Wave 2+).

#### 3. Requirements (condensed)
- Functional
  - Link EOA → deploy dedicated Safe Smart Account with 4337 support on Base for each user.
  - Configure policies: daily spend cap ($100 total), per-action cap ($100), asset whitelist (ETH, USDC, USDT), chain scope (Base).
  - Read portfolio (balances, APY targets); simulate rebalances; execute via SideShift + DeFi protocol calls.
  - Gas Ghost on Base: monitor native balance; micro SideShift to ETH on Base; enforce daily budget and priority funding.
  - Self-hosted IPFS receipts for value-moving actions (quotes, fees, path, hashes).
  - Telegram command/control: /start, /status, /refuel, /rebalance, /settings, and rule-based intent parsing.
  - Fee breakdown must include SideShift fees, spreads, and estimated gas.

- Non‑Functional
  - Availability 99.5% (single-region active with managed failover).
  - Latency: <2s ack to Telegram; <5s to initiate a shift/create on SideShift.
  - Security: session keys (time-bound, scoped), circuit breakers, slippage bounds.
  - Privacy: store only minimal metadata; purge after 30 days.
  - Observability: structured logging, action tracing, SideShift shift lifecycle metrics.

#### 4. High‑Level Architecture
- Control Plane
  - Telegram Bot Service: command parsing, auth handshake, conversation state, rule-based intent extraction (regex + slots for Wave 1).
  - Copilot Service: intent classification, policy checks, simulation, explanation generation, action orchestration.

- Execution Plane
  - AA Service: Safe AA management (one per user), session keys, userOp construction, bundler integration.
  - Swap Service: SideShift client, quote validation, create shift, polling service for status checks (Wave 1), retry logic.
  - Refuel Service: monitors Base native balances, triggers SideShift micro-swaps, enforces daily cap and funding priority.
  - DeFi Integrations: minimal adapters (Aave v3 on Base first) for supply/withdraw and approvals.

- Data Plane
  - Metadata Store (Postgres): users, smart accounts, policies, actions, receipts, SideShift shifts, APY snapshots.
  - Cache (Redis): quotes, rate limits, ephemeral session info.
  - Object Store/IPFS: self-hosted IPFS node for signed action receipts, simulation reports, confirmations.

- External Dependencies
  - SideShift API (quotes, shift creation, status polling for Wave 1).
  - EVM RPCs (Base primary; Ethereum/Arbitrum as read-only initially).
  - Bundler (4337 provider) compatible with Safe AA.
  - Price data: Fixed USD constants for Wave 1; CoinGecko or similar API for Wave 2+.

Deployment: containerized microservices behind an API gateway; polling service for SideShift status; HSM/KMS for key material; WAF + mTLS for internal calls.

#### 5. Detailed Data Flows
- Rebalance (user intent → execution)
  1) User: "Rebalance to 30% stables; target 8% APY."
  2) Copilot reads portfolio, fetches APYs (Aave v3 on Base), computes plan.
  3) Copilot simulates costs: SideShift quote(s), gas estimates (using fixed USD prices for Wave 1), slippage bounds.
  4) If within policy window (amount, assets, chain), proceed; else request confirmation.
  5) Execute: withdraw (if needed) → SideShift shift to target asset/chain (Base) → approve → supply to Aave.
  6) Record: on success, persist action; publish receipt to self-hosted IPFS; reply in Telegram with summary + IPFS link.

- Gas Ghost (Base only)
  1) Watcher polls Base native balance.
  2) If < 0.05 ETH and daily spend < $100, pick funding source (USDC > USDT > ETH).
  3) SideShift quote asset→ETH(Base) for required top-up; create shift to user's Safe AA address on Base.
  4) Poll shift status (5-10s intervals); on completion, AA receives ETH; log + IPFS receipt; notify user in Telegram.

- SideShift Lifecycle (Wave 1 - Polling)
  - Request quote → validate min/max, expiry.
  - Create shift with destination = user's Safe AA address on Base.
  - Transfer funds if deposit required; or monitor for auto-collection mode per SideShift flow.
  - Poll status endpoint (5-10s intervals, max 3m) → state machine transitions (PENDING→CONFIRMED→COMPLETED/FAILED).
  - Wave 2+: Add webhook receiver for real-time updates.

- Telegram Auth
  - /start issues link to web auth (nonce → wallet signature → bind Telegram user to on-chain AA).
  - /link flow deploys dedicated Safe AA for the user on Base.
  - Store minimal mapping: telegram_user_id ↔ user_id ↔ safe_address.

#### 6. Data Model (key tables)
- users(id, telegram_id, primary_wallet, created_at, status)
- accounts(id, user_id, chain_id, safe_address, aa_config, created_at)
- policies(user_id, daily_cap_usd, per_tx_cap_usd, allowed_assets[], allowed_chains[], auto_exec_flags, created_at)
- actions(id, user_id, type, status, requested_params_json, simulation_json, result_json, tx_hashes[], shift_ids[], ipfs_receipt_cid, created_at)
- shifts(shift_id, user_id, from_asset, to_asset, from_chain, to_chain, quote_json, status, created_at, updated_at)
- refuel_ledger(user_id, date, spent_usd, count, last_refuel_at)
- apy_snapshots(protocol, chain, asset, apy, observed_at)

#### 6. Data Model (key tables)
- users(id, telegram_id, primary_wallet, created_at, status)
- accounts(id, user_id, chain_id, safe_address, aa_config, created_at)
- policies(user_id, daily_cap_usd, per_tx_cap_usd, allowed_assets[], allowed_chains[], auto_exec_flags, created_at)
- actions(id, user_id, type, status, requested_params_json, simulation_json, result_json, tx_hashes[], shift_ids[], ipfs_receipt_cid, created_at)
- shifts(shift_id, user_id, from_asset, to_asset, from_chain, to_chain, quote_json, status, created_at, updated_at)
- refuel_ledger(user_id, date, spent_usd, count, last_refuel_at)
- apy_snapshots(protocol, chain, asset, apy, observed_at)

#### 7. Internal APIs (examples)
- POST /intent/rebalance { target: {stables:0.3}, constraints: {...} }
- POST /exec/refuel { chain:"base" }
- GET /portfolio/summary
- POST /policy/update
- POST /sideshift/quote {fromAsset, fromChain, toAsset, toChain, amount}
- POST /sideshift/shift {quoteId, dstAddress}
- GET /sideshift/status/{shiftId} (Wave 1 polling)

#### 8. Scaling and Reliability
- Horizontal scale: stateless services behind LB; Redis for coordination; idempotent action handlers with action_id.
- SideShift backoff/retry with jitter; quote expiry handling; fallback to re-quote.
- Polling service: dedicated worker pool for shift status checks; exponential backoff on errors.
- Circuit breakers: pause auto-exec on repeated failures; notify user.
- Rate limiting: per-user Telegram commands; per-service QPS caps.

#### 9. Security, Privacy, Compliance
- Safe AA with session keys:
  - Scopes: base-only, allowed assets (ETH, USDC, USDT), max per-tx ($100), daily cap ($100 shared), allowed targets (Aave, SideShift deposit).
  - Expiry: 24h default; rotation on policy changes.
  - Each user receives their own dedicated Safe AA on Base.
- No custody of user assets; server holds only session key material in KMS.
- Fee and slippage caps; invariant checks on settlement addresses.
- Data minimization and 30-day log retention; encrypted at rest.
- Compliance: align with SideShift's KYC/AML; no extra tipping features; geo-block only if SideShift denies.

#### 10. Observability
- Tracing: action_id propagated across Telegram → Copilot → Swap → AA → IPFS.
- Metrics: time-to-quote, time-to-shift-initiation, completion rates, refuel triggers, policy violations, polling latency.
- Alerts: SideShift errors spike, bundler failures, IPFS pin failures, balance watchers stale, polling timeouts.

#### 11. Risks and Mitigations
- Quote expiry during execution → detect expiry time; re-quote with user-configured slippage.
- Session key abuse → strict scopes, daily caps, circuit breaker, revoke-on-anomaly.
- Gas price spikes → refuel budget exhausted; notify user; defer auto-refuel.
- Protocol/APY data inaccuracies → conservative simulation; allow "manual confirm" override; provenance of APY snapshots.
- SideShift downtime → queue plans; graceful degradation to single-chain rebalancing or pause.
- Polling delays → set reasonable timeouts (3m max); clear user feedback on delays.

#### 12. Alternatives and Trade‑offs
- Polling vs Webhooks for SideShift: Polling chosen for Wave 1 for simplicity and reliability; webhooks as Wave 2+ enhancement for better latency.
- Safe AA vs Kernel: Safe AA chosen for ecosystem maturity and tooling; Kernel is lighter but requires custom modules.
- Rule-based vs LLM Intent Parsing: Rule-based (regex) chosen for Wave 1 for speed and reliability; LLM deferred to Wave 2+ for natural language support.
- Fixed Prices vs Live Feed: Fixed USD constants for Wave 1 to reduce dependencies; CoinGecko or similar API in Wave 2+ for accuracy.
- Self-hosted vs Managed IPFS: Self-hosted chosen for control and privacy; managed services as future option.

#### 13. Milestones
- Wave 1 (Hackathon): Telegram bot, auth binding, /status, Gas Ghost on Base, SideShift quote/shift with polling, self-hosted IPFS receipts, one rebalance to Aave v3 on Base, rule-based intent parsing.
- Wave 2: Add webhooks for SideShift, live price feeds, Arbitrum read + next chain support, richer simulations, web status page, local LLM integration.
- Wave 3: Auto-rebalance policies, expanded strategy set, institutional controls.

#### 14. Open Questions
- DAU/actions targets to calibrate capacity planning (TBD).
- Exact Aave markets and supported assets on Base at launch (confirm inventory).
- SideShift deposit flow specifics (deposit address vs direct settlement) — to be confirmed during integration.

---

#### 13. Milestones
- Wave 1 (Hackathon): Telegram bot, auth binding, /status, Gas Ghost on Base, SideShift quote/shift, IPFS receipts, one rebalance to Aave v3 on Base.
- Wave 2: Add Arbitrum read + next chain support, richer simulations, web status page.
- Wave 3: Auto-rebalance policies, expanded strategy set, institutional controls.

#### 14. Open Questions
- DAU/actions targets to calibrate capacity planning (TBD).
- Exact Aave markets and supported assets on Base at launch (confirm inventory).
- Webhook hosting constraints (ingress, IP allowlist) — by default, yes we’ll expose a public callback; polling fallback if restricted.

---
