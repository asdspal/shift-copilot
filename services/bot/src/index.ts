import express, { Request, Response } from 'express';
import TelegramBot from 'node-telegram-bot-api';
import { config } from '@shiftcopilot/config';
import { createLogger, generateActionId } from '@shiftcopilot/common';
import type { TelegramUpdate } from '@shiftcopilot/types';
import { parseCommand } from './parser';
import { checkRateLimit } from './rateLimit';
import {
  handleStart,
  handleHelp,
  handleLink,
  handleStatus,
  handleRefuel,
  handleRebalance,
  handleSettings,
  handleDetails,
  handleUnknown,
} from './handlers';

const logger = createLogger('bot-server');

const app = express();
app.use(express.json());

// Initialize Telegram Bot (webhook mode)
const bot = new TelegramBot(config.telegram.botToken);

// Health check endpoint
app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', service: 'bot', timestamp: new Date().toISOString() });
});

// Webhook endpoint for Telegram
app.post('/webhook', async (req: Request, res: Response): Promise<void> => {
  const actionId = generateActionId();
  const startTime = Date.now();

  try {
    // Verify webhook secret (simple header-based auth for Wave 1)
    const secret = req.headers['x-telegram-bot-api-secret-token'];
    if (secret !== config.telegram.webhookSecret) {
      logger.warn({ actionId }, 'Invalid webhook secret');
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const update: TelegramUpdate = req.body;
    logger.info({ actionId, updateId: update.update_id }, 'Received Telegram update');

    // Handle message
    if (update.message && update.message.text) {
      const message = update.message;
      const userId = message.from.id.toString();
      const messageText: string = message.text ?? '';

      // Rate limiting
      const rateLimit = checkRateLimit(userId);
      if (!rateLimit.allowed) {
        const resetIn = Math.ceil((rateLimit.resetAt - Date.now()) / 1000);
        await bot.sendMessage(
          message.chat.id,
          `⚠️ Rate limit exceeded. Please wait ${resetIn} seconds before sending more commands.`
        );
        res.json({ ok: true });
        return;
      }

      // Parse command
      const parsed = parseCommand(messageText);

      let response: string;

      if (!parsed) {
        response = await handleUnknown(message);
      } else {
        // Route to appropriate handler
        switch (parsed.command) {
          case 'start':
            response = await handleStart(message);
            break;
          case 'help':
            response = await handleHelp(message);
            break;
          case 'link':
            response = await handleLink(message);
            break;
          case 'status':
            response = await handleStatus(message);
            break;
          case 'refuel':
            response = await handleRefuel(message);
            break;
          case 'rebalance':
            response = await handleRebalance(
              message,
              parsed.args.assetType as string,
              parsed.args.targetPercentage as number
            );
            break;
          case 'settings':
            response = await handleSettings(message);
            break;
          case 'details':
            response = await handleDetails(message);
            break;
          default:
            response = await handleUnknown(message);
        }
      }

      // Send response
      await bot.sendMessage(message.chat.id, response, { parse_mode: 'Markdown' });

      const duration = Date.now() - startTime;
      logger.info(
        {
          actionId,
          userId,
          command: parsed?.command || 'unknown',
          duration,
        },
        'Command processed successfully'
      );
    }

    res.json({ ok: true });
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error(
      {
        actionId,
        error: error instanceof Error ? error.message : 'Unknown error',
        duration,
      },
      'Error processing webhook'
    );
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Start server
const PORT = process.env.PORT || 3000;

async function startServer() {
  try {
    // Set webhook
    const webhookUrl = config.telegram.webhookUrl;
    await bot.setWebHook(webhookUrl, {
      secret_token: config.telegram.webhookSecret,
    });
    logger.info({ webhookUrl }, 'Telegram webhook set');

    // Start Express server
    app.listen(PORT, () => {
      logger.info({ port: PORT }, 'Bot server started');
    });
  } catch (error) {
    logger.error({ error: error instanceof Error ? error.message : 'Unknown error' }, 'Failed to start server');
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully');
  await bot.deleteWebHook();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down gracefully');
  await bot.deleteWebHook();
  process.exit(0);
});

// Start the server
startServer();
