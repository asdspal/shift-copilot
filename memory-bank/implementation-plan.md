### ShiftCopilot — Implementation and Delivery Plan (per Milestone, with atomic steps, tests, DoD, and estimates)

This plan uses the PRD and SRD as source of truth. Steps are sequential, atomic (≤ 1–2 days each), and each includes tests, a Definition of Done (DoD), and time estimates. Milestones map to previously defined phases, including Wave‑1 MVP (48h).

Notes:
- Estimates are for a senior engineer familiar with stack; adjust if onboarding new contributors.
- "Coverage" refers to line + branch for unit tests.
- All services are assumed Node/TS unless otherwise noted.
- Wave 1 uses polling for SideShift (no webhooks), rule-based intent parsing (no LLM), self-hosted IPFS, and fixed USD pricing.

---

### Milestone 1: Wave‑1 MVP (Base chain, Telegram bot, Gas Ghost, SideShift with polling, Aave supply, self-hosted IPFS receipts)

#### Step 1.1 Repo, CI, and Config Scaffolding
- Implementation (6h)
  - Setup mono‑repo structure: services (bot, api, executor, sideshift, polling-service, watcher, common).
  - Add shared config loader with schema validation (.env.*).
  - Initialize linting (ESLint), formatting (Prettier), TypeScript strict mode.
  - Add CI pipeline: lint, type‑check, unit test, build artifacts.
- Testing (3h)
  - Unit: config schema validation, env precedence, failure on missing required keys.
  - CI dry‑run on branch to confirm pipeline gates.
- DoD
  - CI green on main; config schema rejects missing SideShift base URL and Base RPC; 90% unit coverage for config module; README has repo/bootstrap instructions.

#### Step 1.2 Telegram Bot Service (Webhook + Basic Commands)
- Implementation (8h)
  - Create Telegram bot webhook handler with secret verification.
  - Implement commands: /start, /help, /ping, basic rate limiter (10 cmds/min/user).
  - Rule-based command parser using regex + slots (NO LLM in Wave 1).
  - Health endpoint and request logging with action_id correlation.
- Testing (4h)
  - Unit: command parsing (regex patterns), rate limit hit behavior, webhook signature check.
  - Integration: local webhook hit returns 200; Telegram test chat triggers /ping reply <2s.
- DoD
  - /ping responds in <2s; rate limit enforced; 90% unit coverage on parser; logs include action_id; rule-based parsing handles all core commands.

#### Step 1.3 Wallet Link + Safe AA Deployment on Base
- Implementation (10h)
  - Implement /link: server generates nonce; user signs in wallet; verify signature; bind telegram_user_id ↔ EOA.
  - Integrate Safe SDK to deploy a dedicated Safe AA per user on Base using EOA as owner during /link flow.
  - Persist user, safe_address, and basic account config in Postgres.
- Testing (6h)
  - Unit: nonce lifecycle, signature verification.
  - Integration: deploy Safe on Base testnet/mainnet with small funding; confirm safe_address unique per user.
  - E2E: /start → /link flow completes; bot confirms Safe deployed.
- DoD
  - New user can bind wallet and receive their own dedicated Safe on Base; safe_address stored; 90% coverage for auth flow; one E2E transcript stored.

#### Step 1.4 Session Keys and Policy Enforcement (Base)
- Implementation (8h)
  - Issue a session key scoped to: chain Base, allowed assets [ETH, USDC, USDT], allowed targets [Aave Pool, ERC‑20s, SideShift deposit], per‑tx cap $100, daily cap $100 (shared across all operations), expiry 24h.
  - Executor validates calls against policy prior to sending userOps.
- Testing (6h)
  - Unit: policy checks (caps, targets, assets).
  - Integration: send a permitted and a disallowed userOp; disallowed reverts at validator.
- DoD
  - Disallowed operations blocked with clear error; allowed path succeeds; 90% coverage for policy code; caps persisted and enforced; daily cap shared across all operations.

#### Step 1.5 SideShift Client: Quotes and Shift Creation with Polling
- Implementation (10h)
  - Build typed client: GET quote (min/max/expiry validation), POST shift (store shift_id), state model for shift lifecycle.
  - Implement polling service for shift status checks (5–10s intervals, max 3m); NO webhooks in Wave 1.
  - Assemble total fee breakdown (SideShift fees + gas estimate using fixed USD prices) for UX responses.
- Testing (8h)
  - Unit: JSON parsing, expiry handling, min/max violations, polling interval logic.
  - Integration: mock HTTP server for quote/shift; verify polling service triggers and handles status transitions.
  - E2E: simulate a shift from USDC(Base) → ETH(Base) with polling → status transitions to COMPLETED.
- DoD
  - Client returns validated quotes; shifts progress via polling (no webhooks); 90% coverage; logs include shift_id and status transitions; polling service handles timeouts gracefully.

#### Step 1.6 Gas Ghost Watcher (Base)
- Implementation (8h)
  - Watch Base native balance every 30s; if <0.05 ETH and daily_total_spend < $100, plan top‑up to 0.08 ETH.
  - Select funding source priority: USDC > USDT > ETH (NO LP tokens); ensure per‑tx ≤ $100, daily ≤ $100 (shared).
  - Execute SideShift shift to ETH(Base), destination = user's Safe; use polling service to monitor; notify user on completion.
- Testing (6h)
  - Unit: threshold detection, budget math (shared daily cap), top‑up calculation, funding source selection.
  - Integration: with SideShift mock and polling service, ensure shift created and status handled.
  - Negative: exceed daily budget → refuses and notifies user.
- DoD
  - Auto‑refuel triggers under threshold, respects shared $100 daily budget, posts confirmation; receipt creation wired (stub acceptable until Step 1.8); metrics/logs in place.

#### Step 1.7 Aave v3 Base Adapter (Approve + Supply USDC)
- Implementation (10h)
  - Implement ERC‑20 balanceOf and approve for USDC(Base); integrate Aave v3 Pool supply() call.
  - Build 4337 batch userOp: approve + supply in one operation.
- Testing (8h)
  - Unit: calldata construction, ABI encode/decode.
  - Integration: on Base (testnet or low‑value mainnet), perform approve+ supply; verify on‑chain state change.
  - Negative: insufficient allowance triggers planned error.
- DoD
  - Successful USDC supply to Aave on Base via single batch op; tx hash recorded; 90% coverage for adapter utilities.

#### Step 1.8 Rebalance Simulation and Execution (Stables 30% target)
- Implementation (10h)
  - Portfolio read (ETH, USDC, USDT), fixed USD pricing constants for Wave 1.
  - Compute plan: if stables < 30%, shift from ETH→USDC(Base); then approve+ supply to Aave; include fee and APY delta using fixed prices.
  - Telegram /rebalance stables 30% (parsed via regex): if within policy window and auto‑exec enabled, execute; else seek confirmation.
- Testing (8h)
  - Unit: allocation math, simulation report contents, fee aggregation with fixed prices.
  - Integration: simulated SideShift + Aave batch on Base with small funds; polling service monitors shift.
  - E2E: /rebalance flow produces before/after summary and executes.
- DoD
  - Plan and simulate with explicit numbers using fixed USD prices; execution completes within caps; user sees brief summary + "details" expansion; p95 <5s to shift initiation.

#### Step 1.9 IPFS Receipts (Self-Hosted)
- Implementation (6h)
  - Setup self-hosted IPFS node (local or containerized).
  - Define JSON schema: intent, params, quotes, fees, tx hashes, before/after, policy usage, timestamps.
  - Pin to self-hosted IPFS node; store CID on action; include CID in Telegram messages.
- Testing (4h)
  - Unit: schema validation; pin/unpin mocks; failure retries.
  - Integration: actual pin to self-hosted node returns CID; CID retrievable.
- DoD
  - Every value‑moving action yields an IPFS CID from self-hosted node; CIDs visible in /status and action confirmations; 90% coverage for serializer.

#### Step 1.10 /status, /settings, and "details" UX
- Implementation (6h)
  - /status: balances, allocations, Aave positions, Base gas, policy usage (per‑tx/daily remaining from shared $100 budget), last two action CIDs.
  - /settings: view/toggle auto‑exec, view caps (change optional in Wave‑1).
  - "details": dumps last action's receipt highlights.
- Testing (4h)
  - Unit: rendering functions for concise/expanded text, redaction of secrets.
  - E2E: Commands respond under 2s; data accurate post‑action.
- DoD
  - Commands stable, meet latency SLOs, and reflect recent actions accurately; shared daily budget displayed correctly.

#### Step 1.10 /status, /settings, and “details” UX
- Implementation (6h)
  - /status: balances, allocations, Aave positions, Base gas, policy usage (per‑tx/daily remaining), last two action CIDs.
  - /settings: view/toggle auto‑exec, view caps (change optional in Wave‑1).
  - “details”: dumps last action’s receipt highlights.
- Testing (4h)
  - Unit: rendering functions for concise/expanded text, redaction of secrets.
  - E2E: Commands respond under 2s; data accurate post‑action.
- DoD
  - Commands stable, meet latency SLOs, and reflect recent actions accurately.

#### Step 1.11 Observability and Circuit Breaker
- Implementation (6h)
  - Structured logs: action_id, shift_id, user_id (hashed), durations, fees_usd.
  - Circuit breaker: pause auto‑exec after ≥2 failures in 10m; notify user with resume instructions.
- Testing (4h)
  - Unit: breaker window math; reset behavior.
  - Integration: induce SideShift error twice; verify pause and notification.
- DoD
  - Breaker trips on repeated failures; logs consistent across services.

#### Step 1.12 Documentation and Demo Script
- Implementation (4h)
  - README: setup steps, .env (including self-hosted IPFS and fixed USD prices), architecture diagram (image with polling service), demo script, limitations (webhooks, LLM, live prices in Wave 2+).
  - SERVICE_RUNBOOK.md: health endpoints, common errors, feature flags, polling service management.
- Testing (2h)
  - Dry‑run setup from scratch on a new machine; follow README to a working demo.
- DoD
  - A new contributor can spin up and reproduce demo in <1h; docs PR approved; Wave 1 scope clearly documented.

---

### Milestone 2: Productionization Phase 1 (Webhooks, Live Prices, Web Status Page, Arbitrum Read-Only, LLM Integration)

#### Step 2.1 Harden SideShift Integration (Retries, Idempotency, Metrics)
- Implementation (6h)
  - Add exponential backoff with jitter; idempotency keys for shift creation; detailed metrics (quote_latency, shift_initiation_latency, polling_latency).
- Testing (4h)
  - Unit: retry policy; idempotency behavior under duplicate requests.
  - Integration: inject 5xx faults; confirm retries and no duplicate shifts.
- DoD
  - No duplicate shifts under retry; metrics emitted; error rate resilient to transient faults.

#### Step 2.2 HMAC + IP Allowlist for Webhooks (Enhancement from Polling)
- Implementation (6h)
  - Add webhook receiver with HMAC auth and IP allowlist for SideShift webhooks; clock skew handling.
  - Maintain polling as fallback; webhooks as primary when available.
- Testing (4h)
  - Integration: valid/invalid signature tests; IP spoof attempt blocked; fallback to polling on webhook failure.
- DoD
  - Webhooks processed when available; polling fallback works; alerts on violation.

#### Step 2.3 Web Status Page (Read‑Only)
- Implementation (8h)
  - Minimal web app: login via wallet signature; show balances, positions, recent actions with IPFS links; no writes.
- Testing (6h)
  - Integration: wallet login; fetch APIs; cross‑origin security checks.
  - E2E: status reflects Telegram‑driven actions within 10s.
- DoD
  - Deployed read‑only status page; users can view portfolio without Telegram.

#### Step 2.4 Arbitrum Read‑Only Portfolio Support
- Implementation (6h)
  - Add Arbitrum RPC; read balances for ETH, USDC, USDT; flag as read‑only in UI.
- Testing (4h)
  - Integration: balances match on-chain for test accounts.
- DoD
  - /status includes Arbitrum balances; clearly marked read‑only.

#### Step 2.5 Enhanced Simulation (Live Prices + Gas Estimates)
- Implementation (8h)
  - Integrate CoinGecko or similar lightweight price feed; replace fixed USD constants with live prices.
  - Compute USD fees and APY delta with confidence intervals using live data.
- Testing (4h)
- Implementation (8h)
  - Integrate lightweight price feed and gas estimators; compute USD fees and APY delta with confidence intervals.
- Testing (4h)
  - Unit: price/gas failure falls back to last-known; bounds calculation.
  - Integration: simulation reflects live fees within ±10% of actual post‑execution.
- DoD

#### Step 2.6 Local LLM Integration for Intent Parsing
- Implementation (10h)
  - Setup local LLM inference server (Llama 3 or Mistral instruct).
  - Integrate LLM for natural language intent parsing; maintain rule-based as fallback.
  - Add "details" mode with LLM-generated explanations (temp=0.7).
- Testing (6h)
  - Unit: LLM response parsing, fallback to regex on LLM failure.
  - Integration: natural language commands parsed correctly; latency <2s.
- DoD
  - LLM handles natural language intents; rule-based fallback works; clear toggle between modes.

#### Step 2.7 Availability and SLO Monitoring
- Implementation (6h)
  - Add p95/99 latency dashboards; uptime monitors; alert rules for SLO breaches.
- Testing (4h)
  - Synthetic checks for /status, webhook endpoints, polling service; verify alerts fire on induced latency.
- DoD
  - Dashboards deployed; alerts wired to on‑call channel; monthly uptime tracking.

### Milestone 2: Productionization Phase 1 (Reliability, Webhooks-first, Web Status Page, Arbitrum Read-Only, Better Simulations)

#### Step 2.1 Harden SideShift Integration (Retries, Idempotency, Metrics)
- Implementation (6h)
  - Add exponential backoff with jitter; idempotency keys for shift creation; detailed metrics (quote_latency, shift_initiation_latency).
- Testing (4h)
  - Unit: retry policy; idempotency behavior under duplicate requests.
  - Integration: inject 5xx faults; confirm retries and no duplicate shifts.
- DoD
  - No duplicate shifts under retry; metrics emitted; error rate resilient to transient faults.

#### Step 2.2 HMAC + IP Allowlist for Webhooks
- Implementation (6h)
  - Enforce HMAC auth and IP allowlist for SideShift webhooks; clock skew handling.
- Testing (4h)
  - Integration: valid/invalid signature tests; IP spoof attempt blocked.
- DoD
  - Only valid signed webhooks from allowed IPs are processed; alerts on violation.

#### Step 2.3 Web Status Page (Read‑Only)
- Implementation (8h)
  - Minimal web app: login via wallet signature; show balances, positions, recent actions with IPFS links; no writes.
- Testing (6h)
  - Integration: wallet login; fetch APIs; cross‑origin security checks.
  - E2E: status reflects Telegram‑driven actions within 10s.
- DoD
  - Deployed read‑only status page; users can view portfolio without Telegram.

#### Step 2.4 Arbitrum Read‑Only Portfolio Support
- Implementation (6h)
  - Add Arbitrum RPC; read balances for ETH, USDC, USDT; flag as read‑only in UI.
- Testing (4h)
  - Integration: balances match on-chain for test accounts.
- DoD
  - /status includes Arbitrum balances; clearly marked read‑only.

#### Step 2.5 Enhanced Simulation (Live Prices + Gas Estimates)
- Implementation (8h)
  - Integrate lightweight price feed and gas estimators; compute USD fees and APY delta with confidence intervals.
- Testing (4h)
  - Unit: price/gas failure falls back to last-known; bounds calculation.
  - Integration: simulation reflects live fees within ±10% of actual post‑execution.
- DoD
  - Simulations include live pricing; discrepancy between simulated and actual fees <15% in >80% cases (observed).

#### Step 2.6 Availability and SLO Monitoring
- Implementation (6h)
  - Add p95/99 latency dashboards; uptime monitors; alert rules for SLO breaches.
- Testing (4h)
  - Synthetic checks for /status, webhook endpoints; verify alerts fire on induced latency.
- DoD
  - Dashboards deployed; alerts wired to on‑call channel; monthly uptime tracking.

---

### Milestone 3: Productionization Phase 2 (Auto‑Rebalance Policies, Broader Strategies, Security Hardening)

#### Step 3.1 Auto‑Rebalance Policy Engine
- Implementation (10h)
  - Policy config for periodic checks (e.g., daily), drift thresholds (e.g., >5%), max movement per run; auto‑exec within caps.
- Testing (6h)
  - Unit: drift detection, schedule adherence, cap enforcement.
  - Integration: simulate drift; ensure auto‑rebalance triggers and respects limits.
- DoD
  - Users can enable auto‑rebalance with clear guardrails; logs and receipts created.

#### Step 3.2 Expand Strategy: Withdraw and Move Between Aave and ETH
- Implementation (8h)
  - Add withdraw flow from Aave; rebalance between USDC in Aave and ETH holdings via SideShift if needed.
- Testing (6h)
  - Integration: deposit → withdraw → shift; balances reconcile; APY recalculated.
- DoD
  - Two‑way flows supported and simulated; execution consistent.

#### Step 3.3 Session Key Rotation and Emergency Revoke
- Implementation (6h)
  - Add rotate on schedule or on policy change; one‑click revoke from Telegram /settings.
- Testing (4h)
  - Unit: rotation updates scopes; revoke invalidates immediately.
  - E2E: revoked keys block execution attempts.
- DoD
  - Keys rotatable and revokable; audit log entries created.

#### Step 3.4 Anomaly Detection and Auto‑Pause
- Implementation (8h)
  - Detect abnormal fee spikes, repeated SideShift failures, or unusual slippage; auto‑pause and notify.
- Testing (6h)
  - Integration: inject anomalies; confirm pause and user notice; manual resume works.
- DoD
  - System self‑protects under anomalies; clear UX for recovery.

#### Step 3.5 Data Retention Job and PII Minimization
- Implementation (6h)
  - Daily job to purge logs/metadata >30 days; ensure IPFS receipts remain; verify redaction of sensitive content.
- Testing (4h)
  - Integration: backfill >30d records and confirm deletion; spot check remaining data.
- DoD
  - Automated retention enforced; audit log of deletions maintained.

---

### Cross‑Cutting Quality Gates (applies to all Milestones)
- Security Review: threat model updated, external dependencies listed, secrets in KMS, least‑privilege RBAC.
- Code Coverage: ≥80% overall, ≥90% for critical modules (policy checks, SideShift client, receipts).
- Docs: updated with any new endpoints, configs, operational runbooks.
- E2E Regression: run scripted flows before merging milestone branch to main.

---

### Summary Timeline (indicative)
- Milestone 1 (Wave‑1 MVP): ~5–7 engineer‑days (fits 48h hackathon with 2–3 engineers; some steps in parallel).
- Milestone 2: ~4–6 engineer‑days.
- Milestone 3: ~5–7 engineer‑days.

If you want, I can convert this into an issue tracker import (e.g., GitHub Projects CSV) with labels, assignees, dependencies, and start/due dates.
