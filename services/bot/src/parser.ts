import type { ParsedCommand, Intent } from '@shiftcopilot/types';

// Command patterns for rule-based parsing (Wave 1)
const COMMAND_PATTERNS = {
  start: /^\/start$/i,
  help: /^\/help$/i,
  link: /^\/link$/i,
  status: /^\/status$/i,
  refuel: /^\/refuel$/i,
  settings: /^\/settings$/i,
  details: /^details$/i,
  
  // Rebalance patterns
  rebalance: /^\/rebalance\s+(\w+)\s+(\d+(?:\.\d+)?)%?$/i,
  // Example: /rebalance stables 30
  // Captures: [full match, asset_type, percentage]
};

export function parseCommand(text: string): ParsedCommand | null {
  const trimmed = text.trim();

  // /start
  if (COMMAND_PATTERNS.start.test(trimmed)) {
    return {
      command: 'start',
      args: {},
      raw: trimmed,
    };
  }

  // /help
  if (COMMAND_PATTERNS.help.test(trimmed)) {
    return {
      command: 'help',
      args: {},
      raw: trimmed,
    };
  }

  // /link
  if (COMMAND_PATTERNS.link.test(trimmed)) {
    return {
      command: 'link',
      args: {},
      raw: trimmed,
    };
  }

  // /status
  if (COMMAND_PATTERNS.status.test(trimmed)) {
    return {
      command: 'status',
      args: {},
      raw: trimmed,
    };
  }

  // /refuel
  if (COMMAND_PATTERNS.refuel.test(trimmed)) {
    return {
      command: 'refuel',
      args: {},
      raw: trimmed,
    };
  }

  // /settings
  if (COMMAND_PATTERNS.settings.test(trimmed)) {
    return {
      command: 'settings',
      args: {},
      raw: trimmed,
    };
  }

  // details
  if (COMMAND_PATTERNS.details.test(trimmed)) {
    return {
      command: 'details',
      args: {},
      raw: trimmed,
    };
  }

  // /rebalance stables 30
  const rebalanceMatch = trimmed.match(COMMAND_PATTERNS.rebalance);
  if (rebalanceMatch) {
    const [, assetType, percentage] = rebalanceMatch;
    return {
      command: 'rebalance',
      args: {
        assetType: assetType.toLowerCase(),
        targetPercentage: parseFloat(percentage),
      },
      raw: trimmed,
    };
  }

  // Unknown command
  return null;
}

export function commandToIntent(parsed: ParsedCommand): Intent | null {
  switch (parsed.command) {
    case 'refuel':
      return {
        type: 'refuel',
        params: {},
        requiresConfirmation: false, // Auto-exec within policy
      };

    case 'rebalance':
      return {
        type: 'rebalance',
        params: {
          assetType: parsed.args.assetType,
          targetPercentage: parsed.args.targetPercentage,
        },
        requiresConfirmation: true, // Requires confirmation unless auto-exec enabled
      };

    default:
      return null;
  }
}

export function isValidCommand(text: string): boolean {
  return parseCommand(text) !== null;
}
