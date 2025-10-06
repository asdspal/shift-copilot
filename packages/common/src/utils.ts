import { randomBytes } from 'crypto';

export function generateActionId(): string {
  return `act_${Date.now()}_${randomBytes(8).toString('hex')}`;
}

export function generateNonce(): string {
  return randomBytes(32).toString('hex');
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function exponentialBackoff(attempt: number, baseMs: number = 1000, maxMs: number = 30000): number {
  const delay = Math.min(baseMs * Math.pow(2, attempt), maxMs);
  const jitter = Math.random() * 0.3 * delay;
  return delay + jitter;
}

export function formatUsd(amount: number): string {
  return `$${amount.toFixed(2)}`;
}

export function formatEth(amount: string | number): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  return `${num.toFixed(6)} ETH`;
}

export function truncateAddress(address: string): string {
  if (address.length < 10) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function getCurrentDateString(): string {
  return new Date().toISOString().split('T')[0];
}
