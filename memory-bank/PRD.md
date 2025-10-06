### ShiftCopilot — Product Requirements Document (PRD)

#### 1. Background and Problem
Managing crypto across Ethereum L2s is complex: swapping, moving funds, monitoring gas, and picking yields require high effort and create risk of errors. Users want a simple, conversational assistant that can explain a plan and then actually execute safely, cross-chain, without custody risk.

#### 2. Objectives and KPIs
- Primary Objective: Non-custodial, AI-assisted, cross-chain portfolio automation on Base with clear guardrails and receipts.
- KPIs (first 90 days post‑launch)
  - Activation: 40% of onboarded users deploy Safe AA and complete 1 execution.
  - Reliability: >95% successful execution rate for initiated rebalances; >99% refuel success within policy limits.
  - Time-to-action: median <2s ack, <5s shift init.
  - Transparency: 100% of value actions emit IPFS receipts.

#### 3. Personas
- DeFi Individual: mid/high familiarity, values time savings and safety.
- Power User: wants auto-refuel and occasional auto-rebalance within tight constraints.
- Security-conscious User: wants clear policy limits and auditability.

#### 4. Core Use Cases
- View portfolio and APY targets across Base; see recommended changes.
- Rebalance to target allocation (e.g., 30% stables) with explicit fee/simulation preview.
- Auto-refuel on Base when native ETH < 0.05, using stablecoins first, within daily $100 budget.
- Adjust policy settings via Telegram (/settings) to tune autonomy and caps.
- Retrieve execution receipts with details and IPFS link.

Out of Scope (v1)
- Telegram tipping and P2P transfers.
- Complex multi-protocol strategies beyond Aave v3 supply/withdraw.

#### 5. UX Requirements
- Telegram-first conversational interface; slash commands as shortcuts.
- Always show: effective fees (SideShift + gas), before/after allocation, APY delta.
- Dual explanation mode: brief by default; "details" expands to step-by-step with risks/assumptions.
- Safety feedback: on any auto-exec, post a summary, cap usage, and next reset time.

Commands (MVP)
- /start, /link, /status, /refuel, /rebalance <params>, /settings, "details", "pause/resume automation".

#### 6. Feature Scope
- MVP (Production-grade on Base)
  - Safe AA deploy/bind; session key issuance with scopes.
  - SideShift: quote + create shift; polling primary with webhook enhancement.
  - Aave v3 Base adapter: approve/supply/withdraw.
  - Gas Ghost on Base with thresholds, daily $100 budget (shared with all operations), funding priority: USDC > USDT > ETH.
  - IPFS receipts (self-hosted); 30-day data retention; explicit fee breakdown.
  - Rule-based intent parsing for Wave 1 (local LLM deferred to later waves).

- VNext
  - Add Arbitrum chain support; cross-chain rebalances across Base<->Arb.
  - Strategy templates (conservative/balanced/growth).
  - Web dashboard for visibility + configuration.
  - Advanced anomaly detection for auto-pause.
  - Local LLM integration for natural language intent parsing.

#### 7. Dependencies
- SideShift API, Safe AA stack with 4337 bundler, EVM RPC for Base, self-hosted IPFS node, Redis/Postgres.

#### 8. Success Metrics and Instrumentation
- Engagement: DAU, commands per user, completed actions per user.
- Reliability: failure rates by phase (quote, shift, AA exec), polling latency.
- Safety: policy violations prevented, daily cap utilizations.
- Cost: avg fees per action, gas spend per refuel.

#### 9. Launch Plan
- Private beta: 25–50 users on Base; manual ops support; high observability.
- GA: expand to a few hundred users; add Arbitrum read; stabilize policies.

#### 10. Risks/Assumptions
- SideShift coverage for target pairs on Base must be adequate; fallback to alternative paths may be needed later.
- APY sources can fluctuate; conservative simulations to avoid over-promising.

---
