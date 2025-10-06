import { z } from 'zod';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Configuration schema with validation
const configSchema = z.object({
  // General
  nodeEnv: z.enum(['development', 'production', 'test']).default('development'),
  logLevel: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
  dryRun: z.boolean().default(false),

  // Telegram
  telegram: z.object({
    botToken: z.string().min(1, 'Telegram bot token is required'),
    webhookSecret: z.string().min(1, 'Webhook secret is required'),
    webhookUrl: z.string().url('Valid webhook URL is required'),
  }),

  // Database
  database: z.object({
    url: z.string().url('Valid database URL is required'),
    poolSize: z.number().int().positive().default(10),
  }),

  // Blockchain (Base)
  blockchain: z.object({
    baseRpcUrl: z.string().url('Valid Base RPC URL is required'),
    baseChainId: z.number().int().default(8453),
    bundlerUrl: z.string().url('Valid bundler URL is required'),
    bundlerApiKey: z.string().optional(),
  }),

  // Safe AA
  safe: z.object({
    factoryAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/, 'Valid factory address required'),
    singletonAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/, 'Valid singleton address required'),
    deployerPrivateKey: z.string().regex(/^0x[a-fA-F0-9]{64}$/, 'Valid private key required'),
  }),

  // SideShift
  sideshift: z.object({
    apiUrl: z.string().url('Valid SideShift API URL is required'),
    apiKey: z.string().optional(),
    affiliateId: z.string().optional(),
  }),

  // Polling Service
  polling: z.object({
    intervalMs: z.number().int().positive().default(5000),
    maxDurationMs: z.number().int().positive().default(180000),
  }),

  // IPFS (Self-Hosted)
  ipfs: z.object({
    apiUrl: z.string().url('Valid IPFS API URL is required'),
    gatewayUrl: z.string().url('Valid IPFS gateway URL is required'),
  }),

  // Fixed USD Prices (Wave 1)
  prices: z.object({
    ethUsd: z.number().positive().default(2000),
    usdcUsd: z.number().positive().default(1),
    usdtUsd: z.number().positive().default(1),
  }),

  // Policy Limits
  policy: z.object({
    dailyBudgetUsd: z.number().positive().default(100),
    perTxCapUsd: z.number().positive().default(100),
    minNativeBalanceEth: z.number().positive().default(0.05),
    targetNativeBalanceEth: z.number().positive().default(0.08),
    slippageToleranceBps: z.number().int().positive().default(50),
  }),

  // Gas Ghost
  gasGhost: z.object({
    watcherIntervalMs: z.number().int().positive().default(30000),
    fundingPriority: z.array(z.enum(['USDC', 'USDT', 'ETH'])).default(['USDC', 'USDT', 'ETH']),
  }),

  // Security
  security: z.object({
    jwtSecret: z.string().min(32, 'JWT secret must be at least 32 characters'),
    sessionKeyExpiryHours: z.number().int().positive().default(24),
  }),

  // Observability
  observability: z.object({
    circuitBreakerThreshold: z.number().int().positive().default(2),
    circuitBreakerWindowMs: z.number().int().positive().default(600000),
  }),
});

export type Config = z.infer<typeof configSchema>;

// Parse and validate configuration
function loadConfig(): Config {
  const rawConfig = {
    nodeEnv: process.env.NODE_ENV || 'development',
    logLevel: process.env.LOG_LEVEL || 'info',
    dryRun: process.env.DRY_RUN === 'true',

    telegram: {
      botToken: process.env.TELEGRAM_BOT_TOKEN || '',
      webhookSecret: process.env.TELEGRAM_WEBHOOK_SECRET || '',
      webhookUrl: process.env.TELEGRAM_WEBHOOK_URL || '',
    },

    database: {
      url: process.env.DATABASE_URL || '',
      poolSize: parseInt(process.env.DATABASE_POOL_SIZE || '10', 10),
    },

    blockchain: {
      baseRpcUrl: process.env.BASE_RPC_URL || '',
      baseChainId: parseInt(process.env.BASE_CHAIN_ID || '8453', 10),
      bundlerUrl: process.env.BUNDLER_URL || '',
      bundlerApiKey: process.env.BUNDLER_API_KEY,
    },

    safe: {
      factoryAddress: process.env.SAFE_FACTORY_ADDRESS || '',
      singletonAddress: process.env.SAFE_SINGLETON_ADDRESS || '',
      deployerPrivateKey: process.env.DEPLOYER_PRIVATE_KEY || '',
    },

    sideshift: {
      apiUrl: process.env.SIDESHIFT_API_URL || 'https://sideshift.ai/api/v2',
      apiKey: process.env.SIDESHIFT_API_KEY,
      affiliateId: process.env.SIDESHIFT_AFFILIATE_ID,
    },

    polling: {
      intervalMs: parseInt(process.env.POLLING_INTERVAL_MS || '5000', 10),
      maxDurationMs: parseInt(process.env.POLLING_MAX_DURATION_MS || '180000', 10),
    },

    ipfs: {
      apiUrl: process.env.IPFS_API_URL || 'http://localhost:5001',
      gatewayUrl: process.env.IPFS_GATEWAY_URL || 'http://localhost:8080',
    },

    prices: {
      ethUsd: parseFloat(process.env.FIXED_PRICE_ETH_USD || '2000'),
      usdcUsd: parseFloat(process.env.FIXED_PRICE_USDC_USD || '1'),
      usdtUsd: parseFloat(process.env.FIXED_PRICE_USDT_USD || '1'),
    },

    policy: {
      dailyBudgetUsd: parseFloat(process.env.DAILY_BUDGET_USD || '100'),
      perTxCapUsd: parseFloat(process.env.PER_TX_CAP_USD || '100'),
      minNativeBalanceEth: parseFloat(process.env.MIN_NATIVE_BALANCE_ETH || '0.05'),
      targetNativeBalanceEth: parseFloat(process.env.TARGET_NATIVE_BALANCE_ETH || '0.08'),
      slippageToleranceBps: parseInt(process.env.SLIPPAGE_TOLERANCE_BPS || '50', 10),
    },

    gasGhost: {
      watcherIntervalMs: parseInt(process.env.WATCHER_INTERVAL_MS || '30000', 10),
      fundingPriority: (process.env.FUNDING_PRIORITY || 'USDC,USDT,ETH').split(',') as Array<
        'USDC' | 'USDT' | 'ETH'
      >,
    },

    security: {
      jwtSecret: process.env.JWT_SECRET || '',
      sessionKeyExpiryHours: parseInt(process.env.SESSION_KEY_EXPIRY_HOURS || '24', 10),
    },

    observability: {
      circuitBreakerThreshold: parseInt(process.env.CIRCUIT_BREAKER_THRESHOLD || '2', 10),
      circuitBreakerWindowMs: parseInt(process.env.CIRCUIT_BREAKER_WINDOW_MS || '600000', 10),
    },
  };

  try {
    return configSchema.parse(rawConfig);
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('Configuration validation failed:');
      error.errors.forEach((err) => {
        console.error(`  - ${err.path.join('.')}: ${err.message}`);
      });
      throw new Error('Invalid configuration. Please check your environment variables.');
    }
    throw error;
  }
}

// Export singleton config instance
export const config = loadConfig();
