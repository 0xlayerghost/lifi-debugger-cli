import * as readline from 'node:readline';
import chalk from 'chalk';
import { parseNaturalLanguage } from '../parser/nl-parser.js';
import { handleQuote } from './quote.js';
import { handleCompare } from './compare.js';
import { handleExplain } from './explain.js';
import { handleStatus } from './status.js';
import { handleExport } from './export.js';
import { getLastParams } from '../session/store.js';

export async function handleChat(): Promise<void> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  console.log('');
  console.log(chalk.bold('  🔧 LI.FI Route Debugger — Chat Mode'));
  console.log(chalk.dim('  Type natural language commands to debug cross-chain routes.'));
  console.log(chalk.dim('  Examples:'));
  console.log(chalk.dim('    bridge 100 USDC from Ethereum to Base'));
  console.log(chalk.dim('    compare routes for 500 USDT from Arbitrum to Optimism'));
  console.log(chalk.dim('    explain'));
  console.log(chalk.dim('    check status 0x123...'));
  console.log(chalk.dim('    export as markdown'));
  console.log(chalk.dim(`  Type ${chalk.white('exit')} or ${chalk.white('quit')} to leave.\n`));

  const prompt = (): void => {
    rl.question(chalk.cyan('  lifi-debug > '), async (input) => {
      const trimmed = input.trim().toLowerCase();

      if (trimmed === 'exit' || trimmed === 'quit' || trimmed === 'q') {
        console.log(chalk.dim('\n  Goodbye! 👋\n'));
        rl.close();
        return;
      }

      if (trimmed === 'help') {
        printHelp();
        prompt();
        return;
      }

      if (!trimmed) {
        prompt();
        return;
      }

      const parsed = parseNaturalLanguage(input);
      if (!parsed) {
        console.log(chalk.yellow(`\n  I didn't understand that. Try "bridge 100 USDC from Ethereum to Base" or type "help".\n`));
        prompt();
        return;
      }

      try {
        await executeIntent(parsed);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error(chalk.red(`\n  Error: ${msg}\n`));
      }

      prompt();
    });
  };

  prompt();
}

async function executeIntent(parsed: ReturnType<typeof parseNaturalLanguage>): Promise<void> {
  if (!parsed) return;

  switch (parsed.intent) {
    case 'quote': {
      const params = fillFromSession(parsed);
      if (!params.fromChain || !params.toChain || !params.fromToken || !params.amount) {
        console.log(chalk.yellow('\n  Missing parameters. Try: bridge <amount> <token> from <chain> to <chain>\n'));
        return;
      }
      await handleQuote({
        from: params.fromChain,
        to: params.toChain,
        fromToken: params.fromToken,
        toToken: params.toToken ?? params.fromToken,
        amount: params.amount,
      });
      break;
    }
    case 'compare': {
      const params = fillFromSession(parsed);
      if (!params.fromChain || !params.toChain || !params.fromToken || !params.amount) {
        console.log(chalk.yellow('\n  Missing parameters. Try: compare routes for <amount> <token> from <chain> to <chain>\n'));
        return;
      }
      await handleCompare({
        from: params.fromChain,
        to: params.toChain,
        fromToken: params.fromToken,
        toToken: params.toToken ?? params.fromToken,
        amount: params.amount,
      });
      break;
    }
    case 'explain':
      await handleExplain();
      break;
    case 'status':
      if (!parsed.txHash) {
        console.log(chalk.yellow('\n  Please provide a transaction hash. Try: check status 0x...\n'));
        return;
      }
      await handleStatus({ tx: parsed.txHash });
      break;
    case 'export':
      await handleExport({ format: parsed.format ?? 'json' });
      break;
  }
}

function fillFromSession(parsed: NonNullable<ReturnType<typeof parseNaturalLanguage>>): typeof parsed {
  const lastParams = getLastParams();
  if (!lastParams) return parsed;

  return {
    ...parsed,
    fromChain: parsed.fromChain ?? lastParams.from,
    toChain: parsed.toChain ?? lastParams.to,
    fromToken: parsed.fromToken ?? lastParams.fromToken,
    toToken: parsed.toToken ?? lastParams.toToken,
    amount: parsed.amount ?? lastParams.amount,
  };
}

function printHelp(): void {
  console.log('');
  console.log(chalk.bold('  Available commands:'));
  console.log('');
  console.log(`  ${chalk.cyan('bridge/swap <amount> <token> from <chain> to <chain>')}`);
  console.log(chalk.dim('    Get the best route for a cross-chain transfer'));
  console.log('');
  console.log(`  ${chalk.cyan('compare routes for <amount> <token> from <chain> to <chain>')}`);
  console.log(chalk.dim('    Compare multiple routes'));
  console.log('');
  console.log(`  ${chalk.cyan('explain / why this route?')}`);
  console.log(chalk.dim('    Explain the last route result'));
  console.log('');
  console.log(`  ${chalk.cyan('check status <txHash>')}`);
  console.log(chalk.dim('    Check transaction status'));
  console.log('');
  console.log(`  ${chalk.cyan('export as json/markdown')}`);
  console.log(chalk.dim('    Export last result'));
  console.log('');
  console.log(`  ${chalk.cyan('exit / quit')}`);
  console.log(chalk.dim('    Leave chat mode'));
  console.log('');
}
