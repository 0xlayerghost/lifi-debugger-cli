import chalk from 'chalk';
import type { QuoteResult } from '../core/types.js';
import { chainIdToName, getNativeSymbol } from '../core/chain-map.js';
import { formatTokenAmount } from '../core/token-map.js';

export function renderQuote(quote: QuoteResult): void {
  const fromChain = chainIdToName(quote.action.fromChainId);
  const toChain = chainIdToName(quote.action.toChainId);
  const fromSymbol = quote.action.fromToken.symbol;
  const toSymbol = quote.action.toToken.symbol;
  const fromDecimals = quote.action.fromToken.decimals;
  const toDecimals = quote.action.toToken.decimals;

  const fromAmount = formatTokenAmount(quote.estimate.fromAmount, fromDecimals);
  const toAmount = formatTokenAmount(quote.estimate.toAmount, toDecimals);
  const toAmountMin = formatTokenAmount(quote.estimate.toAmountMin, toDecimals);

  const totalGasUSD = quote.estimate.gasCosts
    .reduce((sum, g) => sum + parseFloat(g.amountUSD), 0)
    .toFixed(2);

  const totalFeeUSD = quote.estimate.feeCosts
    .reduce((sum, f) => sum + parseFloat(f.amountUSD), 0)
    .toFixed(2);

  const duration = quote.estimate.executionDuration;
  const minutes = Math.floor(duration / 60);
  const seconds = duration % 60;
  const timeStr = minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`;

  console.log('');
  console.log(chalk.green.bold('  ✅ Best Route Found'));
  console.log('');
  console.log(`  ${chalk.dim('From:')}       ${chalk.cyan(fromChain)}`);
  console.log(`  ${chalk.dim('To:')}         ${chalk.cyan(toChain)}`);
  console.log(`  ${chalk.dim('Send:')}       ${chalk.white.bold(fromAmount)} ${fromSymbol} ${chalk.dim(`($${quote.estimate.fromAmountUSD ?? 'N/A'})`)}`);
  console.log(`  ${chalk.dim('Receive:')}    ${chalk.yellow.bold(toAmount)} ${toSymbol} ${chalk.dim(`($${quote.estimate.toAmountUSD ?? 'N/A'})`)}`);
  console.log(`  ${chalk.dim('Min receive:')} ${toAmountMin} ${toSymbol}`);
  console.log(`  ${chalk.dim('Time:')}       ~${timeStr}`);
  console.log(`  ${chalk.dim('Gas:')}        $${totalGasUSD}`);
  if (parseFloat(totalFeeUSD) > 0) {
    console.log(`  ${chalk.dim('Fee:')}        $${totalFeeUSD}`);
  }
  console.log(`  ${chalk.dim('Bridge:')}     ${chalk.magenta(quote.toolDetails.name)}`);
  console.log(`  ${chalk.dim('Slippage:')}   ${(quote.action.slippage * 100).toFixed(1)}%`);
  console.log('');

  // Route steps
  const steps = quote.includedSteps.filter(s => s.tool !== 'feeCollection');
  if (steps.length > 0) {
    console.log(chalk.bold('  Route Steps:'));
    steps.forEach((step, i) => {
      const fromC = chainIdToName(step.action.fromChainId);
      const toC = chainIdToName(step.action.toChainId);
      const icon = step.type === 'cross' ? '🌉' : step.type === 'swap' ? '🔄' : '⚙️';
      const toolName = chalk.magenta(step.toolDetails.name);

      if (step.type === 'cross') {
        console.log(`    ${i + 1}. ${icon} Bridge ${fromC} → ${toC} via ${toolName}`);
      } else if (step.type === 'swap') {
        console.log(`    ${i + 1}. ${icon} Swap ${step.action.fromToken.symbol} → ${step.action.toToken.symbol} via ${toolName}`);
      } else {
        console.log(`    ${i + 1}. ${icon} ${step.type} via ${toolName}`);
      }
    });
  }

  // Debug notes
  console.log('');
  console.log(chalk.bold('  Debug Notes:'));
  const gasSymbol = getNativeSymbol(quote.action.fromChainId);
  console.log(chalk.dim(`    • Ensure you have ${gasSymbol} on ${fromChain} for gas`));
  if (steps.length > 2) {
    console.log(chalk.dim(`    • Route has ${steps.length} steps — more steps = more failure points`));
  }
  console.log(chalk.dim(`    • Quote may expire — execute promptly after fetching`));
  console.log('');
}
