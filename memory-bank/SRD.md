### ShiftCopilot — Software Requirements Document (SRD)

#### 1. Overview
This SRD specifies functional and non-functional requirements, interface definitions, state machines, defaults, and acceptance criteria for ShiftCopilot's production MVP on Base.

#### 2. Functional Requirements
- FR‑1 User Onboarding
  - FR‑1.1 Link Telegram account to user profile via nonce + wallet signature.
  - FR‑1.2 Deploy dedicated Safe AA on Base for each user during /link flow; store safe_address.
  - FR‑1.3 Issue session key scoped to: chain=Base, allowedAssets=[ETH, USDC, USDT], allowedTargets=[Aave, SideShift deposit], perTxCap=$100, dailyCap=$100, expiry=24h.

- FR‑2 Portfolio and Simulation
  - FR‑2.1 Read balances for ETH, USDC, USDT on Base.
  - FR‑2.2 Fetch APY for Aave v3 Base markets; cache 60s.
  - FR‑2.3 Simulate rebalance: compute deltas, quotes, gas, slippage; produce before/after allocation and APY delta.

- FR‑3 Rebalance Execution
  - FR‑3.1 If within policy and auto-exec enabled, proceed; else request user confirmation.
  - FR‑3.2 Use SideShift to convert source assets to target assets on Base.
  - FR‑3.3 Batch approvals + supplies via 4337 userOp; verify result; persist and emit IPFS receipt.

- FR‑4 Gas Ghost (Base)
  - FR‑4.1 Monitor native ETH every 30s.
  - FR‑4.2 If < 0.05 ETH and dailyTotalSpend < $100:
    - Choose funding source priority: USDC > USDT > ETH.
    - Quote amount to reach target buffer (configurable, default 0.08 ETH).
    - Create shift to Safe AA on Base; wait completion; log and notify.
  - FR‑4.3 Respect per-tx cap ($100) and daily cap ($100 total for all operations including refuel); decrement budgets atomically.

- FR‑5 Receipts and Transparency
  - FR‑5.1 For each value action, generate a JSON receipt with: timestamps, intent, quotes, fees, tx hashes, before/after summary, policy usage.
  - FR‑5.2 Pin to self-hosted IPFS node; store CID; present link in Telegram.

- FR‑6 Telegram UX
  - FR‑6.1 Commands: /start, /link, /status, /refuel, /rebalance, /settings, "details".
  - FR‑6.2 Acknowledge within 2s; provide progress updates; show total effective fees before execute.
  - FR‑6.3 Rate limit: max 10 commands/min per user.

- FR‑7 SideShift Integration
  - FR‑7.1 Obtain quotes; validate min/max and expiry.
  - FR‑7.2 Create shift with destination address (Safe AA on Base).
  - FR‑7.3 Wave 1: Polling primary (every 5–10s, max 3m) to check shift status; retries with exponential backoff on failure.
  - FR‑7.4 Wave 2+: Webhook receiver with HMAC verification; update state on webhook events.

- FR‑8 Policies and Controls
  - FR‑8.1 Configure per-user policy caps (/settings).
  - FR‑8.2 Circuit breaker on repeated failures (≥2 in 10m): pause auto-exec and notify.

- FR‑9 Data Retention
  - FR‑9.1 Purge logs/metadata after 30 days; retain IPFS receipts only.

#### 3. Non‑Functional Requirements
- NFR‑1 Availability: 99.5% monthly.
- NFR‑2 Latency: 95th percentile <2s for Telegram ack; <5s to shift initiation.
- NFR‑3 Security: keys in KMS; TLS everywhere; RBAC for internal ops.
- NFR‑4 Observability: structured logs, traces, dashboards, alerts.
- NFR‑5 Privacy: no storage of sensitive chat content beyond action context; 30-day TTL.

#### 4. Interfaces

- 4.1 Telegram Command Contracts (examples)
  - /status → Response: allocations, balances, APY targets, gas on Base, policy caps used/remaining.
  - /rebalance stables 30% → Response: simulation summary (fees, slippage, APY delta), "Proceed?" if outside auto-exec scope.
  - /refuel → Response: planned top-up amount, estimated fees, remaining daily budget.

- 4.2 Internal REST (selected)
  - POST /v1/intent/parse { text } → { intent_type, params, confidence }
  - POST /v1/simulate/rebalance { targetAllocations } → { plan, fees, deltas }
  - POST /v1/exec/rebalance { planId } → { action_id, status }
  - POST /v1/refuel { } → { action_id, status }

- 4.3 SideShift Client (abstracted)
  - GET Quote(fromAsset, fromChain, toAsset, toChain, amount) → { rate, min, max, expiresAt, fees }
  - POST Shift(quoteId, destinationAddress, refundAddress?) → { shiftId, depositAddress?, status }
  - GET ShiftStatus(shiftId) → { status, txHash?, details } (Wave 1 polling)
  - Webhook Event { shiftId, status, txHash?, details } (Wave 2+ enhancement)

Note: If SideShift requires deposit to their address, AA executes ERC‑20 transfer or native send; otherwise specify destination for direct settlement on Base.

#### 5. State Machines

- 5.1 Shift Lifecycle
  - NEW → QUOTED(expiry=t) → SHIFT_CREATED → AWAITING_DEPOSIT (if required) → PENDING → COMPLETED | FAILED | EXPIRED
  - On EXPIRED: re-quote; if >1 re-quote, pause and ask user.

- 5.2 Rebalance Action
  - REQUESTED → SIMULATED → POLICY_CHECKED → EXECUTING (shift + AA ops) → SUCCEEDED (IPFS_CID) | FAILED (error_code)

- 5.3 Refuel
  - NEEDS_REFUEL → QUOTED → SHIFT_CREATED → PENDING → TOPPED_UP → LOGGED → NOTIFIED

#### 6. Configuration Defaults
- Chain: Base (chain_id=8453 primary)
- Assets: ETH, USDC, USDT (Wave 1 only)
- Thresholds: Base native ETH min=0.05, target buffer=0.08
- Budgets: daily_cap_usd=100 (shared across all operations including refuel); per_tx_cap_usd=100
- Funding priority: USDC > USDT > ETH
- Intent Parsing: Rule-based (regex) for Wave 1; local LLM deferred to Wave 2+
- Slippage bound for SideShift: 0.5% default (configurable per asset)
- Pricing: Fixed USD constants for Wave 1; real-time price feed (CoinGecko or similar) in Wave 2+
#### 7. Security Details
- Session Key scope:
  - to: [Aave Pool, ERC20 tokens, SideShift deposit addresses]
  - value/allowance limits tied to USD oracle (fixed constants for Wave 1)
  - time window ≤ 24h; renewable
- Validation:
  - Ensure destination address = user's Safe AA or whitelisted protocol
  - No externally specified arbitrary call targets
  - Enforce ERC‑20 permit2 where possible to minimize approval risk
- Polling (Wave 1):
  - Primary method for SideShift status checks (5-10s intervals, max 3m)
  - Exponential backoff on failures; clear timeout handling
- Webhooks (Wave 2+ enhancement):
  - HMAC header verification; replay protection (nonce/timestamp); IP allowlist (preferred)
  - Webhook integration as enhancement after polling is stable

#### 8. Error Handling and Codes
- SS_EXPIRED_QUOTE: Quote expired before deposit; re-quote.
- SS_MIN_MAX_VIOLATION: Amount out of bounds; adjust amount.
- AA_USEROP_REVERT: Contract call failed; include revert reason.
- POLICY_VIOLATION: Cap exceeded or unauthorized target; abort and notify.
- REFUEL_BUDGET_EXCEEDED: Hit $100/day total budget; notify user; schedule for next day.
- IPFS_PIN_FAIL: Retry with backoff; if persistent, store locally and flag.

#### 9. Observability
- Logs: action_id, shift_id, user_id (hashed), event_type, duration_ms, fees_usd
- Metrics: p95 latencies, success rates, SideShift polling lag, policy violation counts
- Alerts: >5% failure rate in 15m; SideShift polling timeout; bundler 5xx; refuel backlog > N

#### 10. Deployment and Infra
- Services: bot, copilot, executor, watcher, sideshift-client, polling-service, api-gateway
- Persistence: Postgres (HA), Redis (HA), self-hosted IPFS node
- Secrets: KMS-backed; rotation policy 90 days
- CI/CD: tests + canary; feature flags for auto-exec

#### 11. Test Plan and Acceptance
- Unit: intent parsing, policy checks, simulation math, quote handling
- Integration: SideShift sandbox (quotes, shift lifecycle with polling), Safe AA + bundler on Base testnet
- E2E: /rebalance happy path; expired quote; policy violation; refuel budget exhaustion
- Performance: load test Telegram handlers; SideShift polling behavior
- Acceptance Criteria
  - AC‑1: /status responds <2s with accurate balances and gas status
  - AC‑2: Rebalance executes on Base with IPFS receipt and correct fee breakdown
  - AC‑3: Auto-refuel triggers under threshold and honors $100/day total budget
  - AC‑4: Policies prevent >$100 per-tx outflows
  - AC‑5: Each user receives their own dedicated Safe AA on Base

---