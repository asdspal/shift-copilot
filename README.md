# ShiftCopilot

> **Your DeFi Copilot on Telegram** - Powered by Safe AA, SideShift, and Aave on Base

ShiftCopilot is an autonomous DeFi agent that helps you manage your crypto portfolio through simple Telegram commands. It uses Safe Account Abstraction (AA) for secure, gasless operations, integrates with SideShift for cross-chain swaps, and leverages Aave v3 for yield generation—all on Base.

---

## 🚀 Features (Wave 1 - 48h MVP)

### ✅ Core Capabilities
- **Telegram Bot Interface** - Natural command-based interaction
- **Safe AA Integration** - One dedicated Safe per user on Base
- **Session Keys** - Secure, policy-constrained automation
- **Gas Ghost** - Auto-refuel when Base ETH drops below threshold
- **SideShift Integration** - Cross-chain swaps for rebalancing
- **Aave v3 Supply** - Automatic USDC yield generation
- **IPFS Receipts** - Self-hosted, immutable action logs
- **Budget Enforcement** - $100 daily cap (shared across all operations)

### 🎯 Supported Operations
1. **Refuel** - Auto-top-up Base gas from USDC/USDT
2. **Rebalance** - Adjust portfolio allocations (e.g., 30% stables, 70% ETH)
3. **Supply to Aave** - Deposit USDC to earn yield

### 🔒 Security & Constraints
- **Wave 1 Scope:** Base chain only (ETH, USDC, USDT)
- **Daily Budget:** $100 (shared across all operations)
- **Per-Transaction Cap:** $100
- **Min Gas Threshold:** 0.05 ETH
- **Slippage Tolerance:** 0.5%
- **Session Key Expiry:** 24 hours

---

## 📦 Architecture

### Monorepo Structure
```
shiftcopilot/
├── services/
│   ├── bot/              # Telegram bot with webhook handler
│   ├── copilot/          # Intent orchestration (future)
│   ├── executor/         # Safe AA + 4337 bundler integration
│   ├── sideshift/        # SideShift API client
│   ├── polling-service/  # Shift status monitoring
│   └── watcher/          # Gas Ghost (Base balance monitoring)
├── packages/
│   ├── common/           # Shared utilities (logger, helpers)
│   ├── types/            # TypeScript type definitions
│   └── config/           # Environment config with Zod validation
└── memory-bank/          # Design docs (PRD, SRD, Wave 1 plan)
```

### Tech Stack
- **Runtime:** Node.js 20+ with TypeScript
- **Bot Framework:** Express + node-telegram-bot-api
- **Blockchain:** Base (Optimism L2)
- **AA Stack:** Safe SDK + 4337 bundler (Pimlico/Alchemy)
- **Storage:** PostgreSQL (user data), IPFS (receipts)
- **Logging:** Pino (structured JSON logs)
- **Validation:** Zod (config + runtime schemas)

---

## 🛠️ Setup

### Prerequisites
- Node.js 20+
- npm 9+
- PostgreSQL 15+ (for user data)
- IPFS node (self-hosted or Infura)
- Telegram Bot Token (via [@BotFather](https://t.me/botfather))
- Base RPC endpoint (Alchemy/Infura)
- 4337 Bundler API key (Pimlico/Alchemy)
- SideShift API key (optional for higher limits)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/shiftcopilot.git
   cd shiftcopilot
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment**
   ```bash
   cp .env.example .env
   # Edit .env with your credentials
   ```

4. **Build all packages**
   ```bash
   npm run build
   ```

5. **Run database migrations** (coming soon)
   ```bash
   npm run migrate
   ```

### Environment Variables

See [`.env.example`](./.env.example) for the complete list. Key variables:

```bash
# Telegram
TELEGRAM_BOT_TOKEN=your_bot_token
TELEGRAM_WEBHOOK_URL=https://yourdomain.com/webhook
TELEGRAM_WEBHOOK_SECRET=random_secret_string

# Base Chain
BASE_RPC_URL=https://base-mainnet.g.alchemy.com/v2/YOUR_KEY
BASE_CHAIN_ID=8453

# Safe AA
SAFE_FACTORY_ADDRESS=0x...
SAFE_SINGLETON_ADDRESS=0x...
BUNDLER_RPC_URL=https://api.pimlico.io/v2/base/rpc?apikey=YOUR_KEY

# SideShift
SIDESHIFT_API_URL=https://sideshift.ai/api/v2
SIDESHIFT_AFFILIATE_ID=your_affiliate_id

# Aave v3 (Base)
AAVE_POOL_ADDRESS=0xA238Dd80C259a72e81d7e4664a9801593F98d1c5
AAVE_USDC_ADDRESS=0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913

# IPFS
IPFS_API_URL=http://localhost:5001
IPFS_GATEWAY_URL=https://ipfs.io/ipfs/

# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/shiftcopilot

# Policy Limits
DAILY_BUDGET_USD=100
PER_TX_CAP_USD=100
MIN_GAS_THRESHOLD_ETH=0.05
TARGET_GAS_ETH=0.08
SLIPPAGE_TOLERANCE_BPS=50
```

---

## 🚀 Running the Services

### Development Mode

**Start the bot service:**
```bash
cd services/bot
npm run dev
```

**Start the watcher (Gas Ghost):**
```bash
cd services/watcher
npm run dev
```

**Start the polling service:**
```bash
cd services/polling-service
npm run dev
```

### Production Mode

```bash
# Build all services
npm run build

# Start with PM2 (recommended)
pm2 start ecosystem.config.js

# Or start individually
cd services/bot && npm start
cd services/watcher && npm start
cd services/polling-service && npm start
```

---

## 📱 Telegram Commands

### Getting Started
- `/start` - Welcome message and overview
- `/help` - View all available commands
- `/link` - Connect your wallet and deploy Safe AA

### Portfolio Management
- `/status` - View balances, allocations, gas levels, and policy usage
- `/refuel` - Manually trigger gas refuel (auto-triggers at <0.05 ETH)
- `/rebalance <type> <percent>` - Rebalance your portfolio
  - Example: `/rebalance stables 30` (set stables to 30%, ETH to 70%)
- `/settings` - View/change auto-execution and policy settings

### Action Details
- `details` - Show detailed breakdown of the last action (with IPFS receipt)

### Example Workflow

1. **Link your wallet:**
   ```
   /link
   → Sign message to verify ownership
   → Safe AA deployed on Base
   → Session key issued (24h expiry)
   ```

2. **Check your status:**
   ```
   /status
   → Balances: 0.15 ETH, 500 USDC, 200 USDT
   → Allocations: 70% stables, 30% ETH
   → Gas: 0.15 ETH ✅
   → Daily budget: $25/$100 used
   ```

3. **Rebalance to 50/50:**
   ```
   /rebalance stables 50
   → Simulation shown with fees
   → Confirm or auto-execute (if within policy)
   → IPFS receipt generated
   ```

4. **View last action:**
   ```
   details
   → Full breakdown with IPFS link
   → Tx hash, fees, before/after balances
   ```

---

## 🏗️ Development

### Project Structure

**Packages:**
- `@shiftcopilot/common` - Shared utilities (logger, helpers)
- `@shiftcopilot/types` - TypeScript type definitions
- `@shiftcopilot/config` - Environment config with Zod validation

**Services:**
- `@shiftcopilot/bot` - Telegram bot with webhook handler
- `@shiftcopilot/copilot` - Intent orchestration (future)
- `@shiftcopilot/executor` - Safe AA + 4337 bundler integration
- `@shiftcopilot/sideshift` - SideShift API client
- `@shiftcopilot/polling-service` - Shift status monitoring
- `@shiftcopilot/watcher` - Gas Ghost (Base balance monitoring)

### Code Quality

**Linting:**
```bash
npm run lint
```

**Formatting:**
```bash
npm run format
```

**Type Checking:**
```bash
npm run typecheck
```

### Testing

```bash
# Run all tests
npm test

# Run tests for a specific package
npm test --workspace=@shiftcopilot/bot

# Run tests in watch mode
npm test -- --watch
```

---

## 📊 Wave 1 Implementation Status

See [`progress.md`](./progress.md) for detailed implementation progress.

### ✅ Completed
- [x] Monorepo structure with npm workspaces
- [x] TypeScript, ESLint, Prettier setup
- [x] Config package with Zod validation
- [x] Types package with domain models
- [x] Common utilities (logger, helpers)
- [x] Telegram bot with webhook handler
- [x] Rule-based command parser (no LLM)
- [x] Rate limiting (10 cmds/min/user)
- [x] Command handlers (mock responses)

### 🚧 In Progress
- [ ] Wallet linking flow with signature verification
- [ ] Safe AA deployment on Base
- [ ] Session key issuance with policy constraints
- [ ] 4337 bundler integration

### 📋 Pending
- [ ] SideShift client (quote + shift creation)
- [ ] Polling service for shift monitoring
- [ ] Self-hosted IPFS node setup
- [ ] IPFS receipt generation
- [ ] Gas Ghost watcher for Base
- [ ] Auto-refuel logic with budget tracking
- [ ] Aave v3 integration (approve + supply)
- [ ] Rebalance simulation with fixed USD pricing
- [ ] Rebalance execution flow
- [ ] Enhanced /settings and /status commands
- [ ] Observability and circuit breaker logic
- [ ] Comprehensive documentation
- [ ] Demo script and recording

---

## 🔐 Security Considerations

### Wave 1 Constraints
- **No LLM parsing** - Rule-based regex patterns only
- **Fixed USD prices** - No oracle integration (hardcoded for MVP)
- **Polling-first** - No webhooks for SideShift (poll every 5s)
- **Single chain** - Base only (no multi-chain support)
- **Budget enforcement** - $100 daily cap (shared across all ops)
- **Session key scope** - Limited to Base, ETH/USDC/USDT only

### Best Practices
- **Never share your `.env` file** - Contains sensitive API keys
- **Use hardware wallets** - For deployer/admin accounts
- **Monitor session keys** - Revoke if suspicious activity detected
- **Review IPFS receipts** - Verify all actions on-chain
- **Set conservative limits** - Start with lower daily budgets

---

## 📚 Documentation

- [PRD (Product Requirements)](./memory-bank/PRD.md)
- [SRD (System Requirements)](./memory-bank/SRD.md)
- [Design Document](./memory-bank/design%20document.md)
- [Implementation Plan](./memory-bank/implementation-plan.md)
- [Wave 1 Specification](./memory-bank/wave1.md)
- [Progress Tracker](./progress.md)

---

## 🤝 Contributing

Contributions are welcome! Please follow these guidelines:

1. **Fork the repository**
2. **Create a feature branch** (`git checkout -b feature/amazing-feature`)
3. **Commit your changes** (`git commit -m 'Add amazing feature'`)
4. **Push to the branch** (`git push origin feature/amazing-feature`)
5. **Open a Pull Request**

### Code Style
- Follow existing TypeScript conventions
- Use Prettier for formatting (`npm run format`)
- Ensure all tests pass (`npm test`)
- Add tests for new features

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.

---

## 🙏 Acknowledgments

- **Safe** - Account Abstraction infrastructure
- **SideShift** - Cross-chain swap aggregator
- **Aave** - Decentralized lending protocol
- **Base** - Optimism L2 for low-cost transactions
- **Pimlico/Alchemy** - 4337 bundler services
- **IPFS** - Decentralized storage for receipts

---

## 📞 Support

- **Issues:** [GitHub Issues](https://github.com/yourusername/shiftcopilot/issues)
- **Discussions:** [GitHub Discussions](https://github.com/yourusername/shiftcopilot/discussions)
- **Telegram:** [@ShiftCopilotSupport](https://t.me/shiftcopilotsupport) (coming soon)

---

## 🗺️ Roadmap

### Wave 2 (Post-MVP)
- [ ] Multi-chain support (Arbitrum, Optimism, Polygon)
- [ ] LLM-based intent parsing (GPT-4/Claude)
- [ ] Advanced rebalancing strategies
- [ ] DCA (Dollar-Cost Averaging) automation
- [ ] Yield optimization across protocols
- [ ] Portfolio analytics and insights
- [ ] Web dashboard for advanced users
- [ ] Mobile app (React Native)

### Wave 3 (Future)
- [ ] Social trading (copy strategies)
- [ ] DAO governance integration
- [ ] NFT portfolio management
- [ ] Limit orders and stop-loss
- [ ] Tax reporting and export
- [ ] Multi-user Safe support
- [ ] Advanced risk management

---

**Built with ❤️ by the ShiftCopilot team**

*Disclaimer: This is experimental software. Use at your own risk. Always verify transactions before execution.*
