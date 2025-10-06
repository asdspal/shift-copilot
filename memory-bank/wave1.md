### ShiftCopilot — Wave‑1 Scoping Checklist (48‑Hour Demo)

#### Purpose
Build a production‑leaning demo in 48 hours that proves:
- Telegram command/control
- Safe AA on Base with session keys (one dedicated Safe per user)
- Gas Ghost auto‑refuel on Base (threshold 0.05 ETH, daily budget $100 shared with all operations, funding priority USDC > USDT > ETH)
- SideShift integration (quote + shift, polling-first for status checks)
- One rebalance flow to Aave v3 on Base
- Self-hosted IPFS receipt per value‑moving action
- Policy guardrails (per‑tx ≤ $100; daily ≤ $100 total; fee transparency)
- Rule-based intent parsing (regex + slots; LLM deferred to Wave 2+)
- Fixed USD pricing for simulations (live price feeds in Wave 2+)

Use testable, minimal mainnet flows or dry‑run mode if needed.

---

### 0) Scope Boundaries
- In scope
  - Base chain only (prod demo on Base mainnet preferred; enable dry‑run if funding is constrained)
  - Assets: ETH, USDC, USDT only
  - Aave v3 (supply USDC on Base)
  - Telegram UX: /start, /link, /status, /refuel, /rebalance, /settings, "details"
  - Rule-based intent parser (regex + slots); NO LLM in Wave 1
  - SideShift polling (5-10s intervals) for shift status; NO webhooks in Wave 1
  - Self-hosted IPFS node for receipts
  - Fixed USD price constants for simulations
  - Each user gets their own dedicated Safe AA on Base

- Out of scope (Wave‑1)
  - Telegram P2P tipping
  - Multi‑chain (Arbitrum/Ethereum execution)
  - Complex strategy marketplace
  - Web dashboard (optional status page only)
  - Local LLM / natural language parsing (Wave 2+)
  - SideShift webhooks (Wave 2+ enhancement)
  - Live price feeds (Wave 2+)
  - wstETH or other assets beyond ETH, USDC, USDT
  - LP tokens as funding source

---

### 1) Deliverables (What must exist by T+48h)
#### Day 1 (Hours 0–24)
- H0–2: Repo + Env + Skeleton
  - [] Create mono‑repo structure (services: bot, copilot, executor, sideshift, polling-service, watcher)
  - [] Add .env templates; define config schema
  - [] Pick stack (Node/TS preferred) and bootstrap services

- H2–6: Telegram Bot + Auth Binding
  - [] Create bot with webhook endpoint
  - [] Implement /start, /link (nonce + wallet signature flow), /status
  - [] Rule-based command parser (regex + slots; NO LLM)
  - [] Persist telegram_user_id ↔ user_id ↔ safe_address

- H6–12: Safe AA on Base + Session Keys
  - [] Integrate Safe SDK; deploy dedicated Safe AA per user on Base during /link
  - [] Connect to 4337 bundler; send a test userOp
  - [] Implement session key issuance (scope: Base, assets [ETH, USDC, USDT], per‑tx $100, daily $100 shared, expiry 24h)
  - [] Policy checks in executor (reject outside bounds)

- H12–16: SideShift Client (Polling-First)
  - [] Quote API wrapper (validate min/max, expiry)
  - [] Create shift API; model shift state; persist shift_id
  - [] Polling service for shift status (5–10s intervals, max 3m); NO webhooks in Wave 1
  - [] Fee breakdown assembly (SideShift + gas estimate using fixed USD prices)

- H16–20: IPFS Receipts (Self-Hosted)
  - [] Setup self-hosted IPFS node
  - [] Define JSON schema (intent, quotes, fees, tx hashes, before/after, policy usage)
  - [] Integrate pinning; return CID; store in DB

- H20–24: Gas Ghost (Base)
  - [] Watcher checks Base native balance every 30s
  - [] If < 0.05 ETH and daily total spend < $100: choose funding source (USDC > USDT > ETH)
  - [] SideShift quote/shift to ETH on Base; poll for completion; notify user
  - [] Enforce per‑tx and daily caps atomically; log receipt to self-hosted IPFS

#### Day 2 (Hours 24–48)
- H24–30: Rebalance Simulation + Aave v3 Integration
  - [] Fetch balances (ETH, USDC, USDT); use fixed USD price constants
  - [] APY snapshot for Aave USDC on Base (constant acceptable for Wave‑1)
  - [] Simulate "stables 30% target; 8% APY goal" → plan steps + fees + APY delta
  - [] Implement approve/supply USDC to Aave via 4337 batch call

- H30–34: Copilot Orchestration + Policies
  - [] Command: /rebalance stables 30% (parsed via regex)
  - [] If within auto‑exec window, proceed; else ask to confirm
  - [] Post brief summary; "details" expands to step‑by‑step with risks
- H34–38: /status + /settings polish
  - [] Status: balances, allocations, APY, Base gas, policy usage (per‑tx/daily remaining), last actions with IPFS CIDs
  - [] Settings: toggle auto‑exec, view/change caps (within hard max), show current policy

- H38–42: Observability + Circuit Breakers
  - [] Structured logs with action_id and shift_id
  - [] Metrics counters (in logs) for success/failure
  - [] Circuit breaker: pause auto‑exec after ≥2 failures/10m; notify user

- H42–46: Hardening + Docs
  - [] Retry/jitter for SideShift polling; handle expired quotes
  - [] Validate destination addresses; slippage guard (default 0.5%)
  - [] README: setup, architecture diagram, .env, demo script, limitations
  - [] Seed script for a demo account

- H46–48: End‑to‑End Dry Runs + Recording
  - [] Run full demo script (below) twice
  - [] Record a no‑cuts screen capture of key flows

---

### 3) Environment & Config Checklist
- [] Telegram bot token
- [] SideShift API key (if required) and base URL
- [] Public webhook URL (ngrok or cloud) for Telegram only (NO SideShift webhooks in Wave 1)
- [] Base RPC endpoint (robust provider)
- [] 4337 bundler endpoint for Base
- [] Self-hosted IPFS node setup and configuration
- [] Fixed USD price constants (ETH, USDC, USDT)
- [] Signer/funder key for initial Safe deployment (minimal funds)
- [] App salts/nonces for auth; JWT secret for bot server
- [] Feature flags: DRY_RUN=true/false; POLLING_INTERVAL=5-10s

Runtime defaults (Wave‑1):
- Chain: Base
- Assets: ETH, USDC, USDT only
- Min native: 0.05 ETH; target buffer: 0.08 ETH
- Daily budget: $100 (shared across all operations including refuel)
- Per‑tx cap: $100
- Funding priority: USDC > USDT > ETH (NO LP tokens)
- Slippage bound: 0.5%
- Polling interval: 5-10s; max polling duration: 3m
- Intent parsing: Rule-based (regex + slots); NO LLM
- Pricing: Fixed USD constants
- Per‑tx cap: $100
- Funding priority: USDC > USDT > ETH (NO LP tokens)
- Slippage bound: 0.5%
- Polling interval: 5-10s; max polling duration: 3m
- Intent parsing: Rule-based (regex + slots); NO LLM
- Pricing: Fixed USD constants

---

### 4) Component‑Level Task Lists

#### A) Repo/Infra
- [] Monorepo with packages: api, bot, executor, sideshift, polling-service, watcher, common
- [] Dockerfiles per service; docker‑compose for local dev
- [] Health endpoints; shared error codes
- [] Self-hosted IPFS node setup

#### B) Telegram Bot
- [] Webhook mode; verify secret
- [] Commands: /start, /link, /status, /refuel, /rebalance, /settings, "details"
- [] Rule-based intent parser (regex + slots) for Wave‑1; NO LLM
- [] Rate limit: 10 cmds/min/user

#### C) Auth & Accounts
- [] /link flow: generate nonce → user signs → bind wallet to Telegram user
- [] Deploy dedicated Safe AA per user on Base during /link (store safe_address)
- [] Issue session key with policy constraints; store in KMS/vault
- [] Revoke/rotate key endpoint

#### D) SideShift Integration (Polling-First)
- [] Quote wrapper: fromAsset, fromChain, toAsset, toChain, amount
- [] Create shift: store shift_id, status
- [] Polling service for status checks (5-10s intervals, max 3m); NO webhooks in Wave 1
- [] Error mapping: EXPIRED_QUOTE, MIN_MAX, etc.

#### E) Gas Ghost (Base)
- [] Watcher with 30s interval
- [] Budget tracking table (date → spent_usd) for $100 daily total
- [] Top‑up planner: amount to reach 0.08 ETH
- [] Execute shift; poll for completion; notify + receipt

#### F) Rebalance + Aave
- [] Portfolio fetch (ERC‑20 balanceOf, native balance)
- [] Fixed USD price constants for ETH, USDC, USDT
- [] APY provider (constant map OK for Wave 1)
- [] Planner: compute deltas; choose USDC on Aave
- [] Executor: batch approve + supply via 4337
- [] Simulation report (fees using fixed prices, APY, before/after)

#### G) IPFS Receipts (Self-Hosted)
- [] Setup and configure self-hosted IPFS node
- [] JSON schema
- [] Pin and return CID; store CID on action
- [] Telegram: include CID link

#### H) Policies & Safety
### 5) Demo Script (Step‑by‑Step)
1) /start → /link → sign nonce in wallet; bot deploys dedicated Safe AA on Base and confirms.
2) /status → shows balances (seeded USDC + tiny ETH), APY target, Base gas level, policy caps.
3) Bot detects Base gas <0.05 → proposes auto‑refuel (from USDC) with full fee breakdown (using fixed USD prices).
   - Auto‑exec within policy → SideShift shift executes → polling service monitors → bot reports "Refueled 0.03 ETH" + self-hosted IPFS receipt CID.
4) /rebalance stables 30%
   - Bot replies with simulation: move X USDC to Aave; fees $y (calculated with fixed prices); APY 7–8%; before/after allocations.
   - Within policy window → executes SideShift leg if needed (or direct if already USDC on Base), batch approve+deposit → polling monitors → success + IPFS CID.
5) /status → shows updated allocation, Aave supply, remaining daily caps, last two actions with CIDs.
6) "details" → prints step‑by‑step of last action (quotes, tx hashes, fees).

---

### 6) Acceptance Criteria (Wave‑1)
- AC‑1: /status responds in <2s with accurate Base balances and gas level
- AC‑2: Auto‑refuel triggers when native <0.05 ETH and respects $100/day total budget; receipt CID produced
- AC‑3: Rebalance to Aave USDC on Base completes and returns fee breakdown + receipt CID
- AC‑4: Per‑tx and daily caps enforced; attempts beyond caps are rejected with clear message
- AC‑5: SideShift integration: at least one successful shift end‑to‑end with polling-based status checks
- AC‑6: Logs contain action_id and shift_id for each value‑moving action
- AC‑7: Each user receives their own dedicated Safe AA on Base
- AC‑8: Rule-based intent parsing handles all core commands without LLM
- AC‑9: Self-hosted IPFS receipts are generated and accessible

---

### 7) Risk Matrix & Fallbacks
- SideShift min size too high or API unreachable
  - Fallback: DRY_RUN mode with simulated quotes; label "simulation" in receipts
  - Polling with clear timeout handling (max 3m)
- Bundler instability on Base
  - Fallback: direct tx for non‑batched flows; reduce to single call per action
- Aave adapter complexity/time
  - Fallback: implement simple ERC‑20 swap + hold; simulate Aave deposit in receipt
- Low funding on demo wallet
  - Fallback: showcase with tiny amounts or dry‑run; pre‑record a successful run for judges
- Self-hosted IPFS node issues
  - Fallback: local file storage with IPFS CID simulation; migrate to proper IPFS when stable
- Polling delays or timeouts
  - Fallback: clear user messaging on delays; retry logic with exponential backoff

---

### 8) Test Checklist
- [] Unit: intent parsing (regex), policy math, USD cap accounting, quote expiry logic
- [] Integration: Safe deploy per user, 4337 userOp, SideShift quote/shift, polling service
- [] E2E: Auto‑refuel with polling, Rebalance, Receipt IPFS pin to self-hosted node
- [] Negative: expired quote, policy violation, insufficient funds, polling timeout

---

### 7) Risk Matrix & Fallbacks
- SideShift min size too high or API unreachable
  - Fallback: DRY_RUN mode with simulated quotes; label “simulation” in receipts
  - Polling fallback if webhooks blocked
- Bundler instability on Base
  - Fallback: direct tx for non‑batched flows; reduce to single call per action
- Aave adapter complexity/time
  - Fallback: implement simple ERC‑20 swap + hold; simulate Aave deposit in receipt
- Low funding on demo wallet
  - Fallback: showcase with tiny amounts or dry‑run; pre‑record a successful run for judges
- LLM latency/quality
  - Fallback: rule-based intent parser for Wave‑1; add LLM later

---

### 8) Test Checklist
- [] Unit: intent parsing (rule-based); policy math; USD cap accounting; quote expiry logic
- [] Integration: Safe deploy; 4337 userOp; SideShift quote/shift with polling service
- [] E2E: Auto‑refuel; Rebalance; Receipt IPFS pin (self‑hosted)
- [] Negative: expired quote; policy violation; insufficient funds; webhook signature fail; polling edge cases

---

### 9) Documentation & Assets
- [] README with:
  - Overview and scope
  - Architecture diagram (control, execution, data planes with polling service)
  - Setup steps and .env guide (including self-hosted IPFS setup)
  - Demo script and acceptance criteria
  - Limitations and next steps (webhooks, LLM, live prices in Wave 2+)
- [] SERVICE_RUNBOOK.md (env, health checks, common errors, polling service management)
- [] Recorded demo (optional but recommended)

---

### 10) Nice‑to‑Haves (Only if time remains)
- [] "Pause automation" toggle in /settings
- [] Basic status webpage (read‑only)
- [] Enhanced logging dashboard
- [] Automated tests for polling service edge cases

---

If you want, I can provide:
- A minimal .env template with all Wave 1 requirements
- The receipt JSON schema
- Pseudocode for SideShift quote/shift with polling service
- A Safe 4337 batch call example for approve + supply on Aave
- Self-hosted IPFS node setup guide
- Rule-based intent parser regex patterns

---

### 9) Documentation & Assets
- [] README with:
  - Overview and scope
  - Architecture diagram (control, execution, data planes)
  - Setup steps and .env guide
  - Demo script and acceptance criteria
  - Limitations and next steps
- [] SERVICE_RUNBOOK.md (env, health checks, common errors)
- [] Recorded demo (optional but recommended)

---

### 10) Nice‑to‑Haves (Only if time remains)
- [] “Pause automation” toggle in /settings
- [] Price feed via lightweight API instead of constants
- [] IPFS receipt hash anchored on‑chain (cheap attestation)
- [] Basic status webpage (read‑only)

---

If you want, I can provide:
- A minimal .env template
- The receipt JSON schema
- Pseudocode for SideShift quote/shift and the Gas Ghost top‑up planner
- A Safe 4337 batch call example for approve + supply on Aave
