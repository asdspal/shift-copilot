// ============================================
// Core Domain Types
// ============================================

export type ChainId = 8453; // Base mainnet
export type AssetSymbol = 'ETH' | 'USDC' | 'USDT';

export interface User {
  id: string;
  telegramUserId: string;
  walletAddress: string;
  safeAddress: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface SessionKey {
  id: string;
  userId: string;
  publicKey: string;
  chainId: ChainId;
  allowedAssets: AssetSymbol[];
  allowedTargets: string[];
  perTxCapUsd: number;
  dailyCapUsd: number;
  expiresAt: Date;
  createdAt: Date;
}

// ============================================
// SideShift Types
// ============================================

export interface SideShiftQuote {
  id: string;
  depositCoin: string;
  settleCoin: string;
  depositNetwork: string;
  settleNetwork: string;
  depositAmount: string;
  settleAmount: string;
  rate: string;
  expiresAt: Date;
  createdAt: Date;
}

export interface SideShiftShift {
  id: string;
  quoteId: string;
  depositAddress: string;
  settleAddress: string;
  status: ShiftStatus;
  depositCoin: string;
  settleCoin: string;
  depositNetwork: string;
  settleNetwork: string;
  depositAmount: string;
  settleAmount: string;
  txHash?: string;
  createdAt: Date;
  updatedAt: Date;
}

export type ShiftStatus =
  | 'pending'
  | 'processing'
  | 'settling'
  | 'settled'
  | 'refund'
  | 'refunded'
  | 'expired';

// ============================================
// Action & Receipt Types
// ============================================

export type ActionType = 'refuel' | 'rebalance' | 'swap' | 'supply' | 'withdraw';

export interface Action {
  id: string;
  userId: string;
  type: ActionType;
  status: ActionStatus;
  intent: string;
  params: Record<string, unknown>;
  receiptCid?: string;
  createdAt: Date;
  updatedAt: Date;
}

export type ActionStatus = 'pending' | 'simulating' | 'executing' | 'completed' | 'failed';

export interface Receipt {
  actionId: string;
  intent: string;
  params: Record<string, unknown>;
  quotes: SideShiftQuote[];
  fees: FeeBreakdown;
  txHashes: string[];
  beforeState: PortfolioSnapshot;
  afterState: PortfolioSnapshot;
  policyUsage: PolicyUsage;
  timestamp: Date;
}

export interface FeeBreakdown {
  sideshiftFeeUsd: number;
  gasFeeUsd: number;
  totalFeeUsd: number;
}

export interface PortfolioSnapshot {
  balances: Record<AssetSymbol, string>;
  allocations: Record<string, number>; // e.g., { "stables": 30, "eth": 70 }
  aavePositions: AavePosition[];
  totalValueUsd: number;
}

export interface AavePosition {
  asset: AssetSymbol;
  supplied: string;
  apy: number;
}

export interface PolicyUsage {
  dailySpentUsd: number;
  dailyRemainingUsd: number;
  perTxCapUsd: number;
  date: string; // YYYY-MM-DD
}

// ============================================
// Budget Tracking Types
// ============================================

export interface BudgetEntry {
  id: string;
  userId: string;
  date: string; // YYYY-MM-DD
  spentUsd: number;
  actions: string[]; // action IDs
  createdAt: Date;
  updatedAt: Date;
}

// ============================================
// Command & Intent Types
// ============================================

export interface ParsedCommand {
  command: string;
  args: Record<string, string | number>;
  raw: string;
}

export interface Intent {
  type: ActionType;
  params: Record<string, unknown>;
  requiresConfirmation: boolean;
}

// ============================================
// Telegram Types
// ============================================

export interface TelegramUpdate {
  update_id: number;
  message?: TelegramMessage;
  callback_query?: TelegramCallbackQuery;
}

export interface TelegramMessage {
  message_id: number;
  from: TelegramUser;
  chat: TelegramChat;
  date: number;
  text?: string;
}

export interface TelegramUser {
  id: number;
  is_bot: boolean;
  first_name: string;
  last_name?: string;
  username?: string;
}

export interface TelegramChat {
  id: number;
  type: string;
  title?: string;
  username?: string;
  first_name?: string;
  last_name?: string;
}

export interface TelegramCallbackQuery {
  id: string;
  from: TelegramUser;
  message?: TelegramMessage;
  data?: string;
}

// ============================================
// Observability Types
// ============================================

export interface LogContext {
  actionId?: string;
  shiftId?: string;
  userId?: string;
  service: string;
  [key: string]: unknown;
}

export interface CircuitBreakerState {
  isOpen: boolean;
  failureCount: number;
  lastFailureAt?: Date;
  opensAt?: Date;
}
