#!/usr/bin/env node

import { Command } from 'commander';
import { handleQuote } from '../src/commands/quote.js';
import { handleCompare } from '../src/commands/compare.js';
import { handleExplain } from '../src/commands/explain.js';
import { handleStatus } from '../src/commands/status.js';
import { handleExport } from '../src/commands/export.js';
import { handleChat } from '../src/commands/chat.js';

const program = new Command();

program
  .name('lifi-debug')
  .description('A chat-first CLI for debugging, comparing, and explaining LI.FI routes')
  .version('1.0.0');

// quote command
program
  .command('quote')
  .description('Get the best route for a cross-chain transfer')
  .requiredOption('--from <chain>', 'Source chain (e.g., Ethereum, Arbitrum)')
  .requiredOption('--to <chain>', 'Destination chain (e.g., Base, Polygon)')
  .requiredOption('--from-token <symbol>', 'Source token symbol (e.g., USDC, ETH)')
  .requiredOption('--to-token <symbol>', 'Destination token symbol (e.g., ETH, USDC)')
  .requiredOption('--amount <number>', 'Amount to transfer')
  .action(async (opts) => {
    await handleQuote({
      from: opts.from,
      to: opts.to,
      fromToken: opts.fromToken,
      toToken: opts.toToken,
      amount: opts.amount,
    });
  });

// compare command
program
  .command('compare')
  .description('Compare multiple routes for a cross-chain transfer')
  .requiredOption('--from <chain>', 'Source chain')
  .requiredOption('--to <chain>', 'Destination chain')
  .requiredOption('--from-token <symbol>', 'Source token symbol')
  .requiredOption('--to-token <symbol>', 'Destination token symbol')
  .requiredOption('--amount <number>', 'Amount to transfer')
  .action(async (opts) => {
    await handleCompare({
      from: opts.from,
      to: opts.to,
      fromToken: opts.fromToken,
      toToken: opts.toToken,
      amount: opts.amount,
    });
  });

// explain command
program
  .command('explain')
  .description('Explain the last route result in plain English')
  .option('--last', 'Explain the last result (default behavior)')
  .action(async () => {
    await handleExplain();
  });

// status command
program
  .command('status')
  .description('Check the status of a cross-chain transaction')
  .requiredOption('--tx <hash>', 'Transaction hash to check')
  .option('--from-chain <chain>', 'Source chain (helps with lookup)')
  .option('--to-chain <chain>', 'Destination chain (helps with lookup)')
  .action(async (opts) => {
    await handleStatus({
      tx: opts.tx,
      fromChain: opts.fromChain,
      toChain: opts.toChain,
    });
  });

// export command
program
  .command('export')
  .description('Export the last result as JSON or Markdown')
  .requiredOption('--format <type>', 'Export format: json or markdown')
  .action(async (opts) => {
    await handleExport({ format: opts.format });
  });

// chat command
program
  .command('chat')
  .description('Enter interactive chat mode for natural language debugging')
  .action(async () => {
    await handleChat();
  });

program.parse();
