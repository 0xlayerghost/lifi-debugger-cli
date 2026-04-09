import chalk from 'chalk';
import type { QuoteResult } from '../core/types.js';
import type { AdvancedRoute } from '../core/lifi-client.js';
import { chainIdToName, getNativeSymbol } from '../core/chain-map.js';
import { formatTokenAmount } from '../core/token-map.js';

export function renderExplainQuote(quote: QuoteResult): void {
  const fromChain = chainIdToName(quote.action.fromChainId);
  const toChain = chainIdToName(quote.action.toChainId);
  const fromSymbol = quote.action.fromToken.symbol;
  const toSymbol = quote.action.toToken.symbol;

  console.log('');
  console.log(chalk.bold('  📖 Route Explanation'));
  console.log('');
  console.log(chalk.dim(`  Transfer: ${fromSymbol} on ${fromChain} → ${toSymbol} on ${toChain}`));
  console.log('');

  // Step-by-step breakdown
  console.log(chalk.bold('  Step-by-Step:'));
  let stepNum = 1;

  const steps = quote.includedSteps.filter(s => s.tool !== 'feeCollection');

  // Check if approval is needed
  const fromToken = quote.action.fromToken;
  if (fromToken.address !== '0x0000000000000000000000000000000000000000') {
    console.log(chalk.cyan(`    ${stepNum}. Approve ${fromSymbol} spending on ${fromChain}`));
    console.log(chalk.dim(`       Your wallet will ask you to approve the LI.FI contract to spend your ${fromSymbol}.`));
    stepNum++;
  }

  for (const step of steps) {
    const fromC = chainIdToName(step.action.fromChainId);
    const toC = chainIdToName(step.action.toChainId);
    const toolName = step.toolDetails.name;

    if (step.type === 'cross') {
      const toAmt = formatTokenAmount(step.estimate.toAmount, quote.action.toToken.decimals);
      console.log(chalk.cyan(`    ${stepNum}. Bridge from ${fromC} to ${toC} via ${toolName}`));
      console.log(chalk.dim(`       Your ${step.action.fromToken.symbol} is sent through the ${toolName} bridge.`));
      console.log(chalk.dim(`       Expected to receive ~${toAmt} ${step.action.toToken.symbol} on ${toC}.`));
    } else if (step.type === 'swap') {
      const toAmt = formatTokenAmount(step.estimate.toAmount, step.action.toToken.decimals);
      console.log(chalk.cyan(`    ${stepNum}. Swap ${step.action.fromToken.symbol} → ${step.action.toToken.symbol} on ${fromC} via ${toolName}`));
      console.log(chalk.dim(`       DEX swap on the ${fromC === toC ? 'same' : 'destination'} chain.`));
      console.log(chalk.dim(`       Expected output: ~${toAmt} ${step.action.toToken.symbol}`));
    } else {
      console.log(chalk.cyan(`    ${stepNum}. ${step.type} via ${toolName}`));
    }

    const dur = step.estimate.executionDuration;
    if (dur > 0) {
      const timeStr = dur < 60 ? `${dur}s` : `${Math.floor(dur / 60)}m ${dur % 60}s`;
      console.log(chalk.dim(`       Estimated time: ~${timeStr}`));
    }
    stepNum++;
  }

  console.log(chalk.cyan(`    ${stepNum}. Receive ${toSymbol} in your wallet on ${toChain}`));

  // Why this route
  console.log('');
  console.log(chalk.bold('  Why This Route:'));
  console.log(chalk.dim(`    • Uses ${quote.toolDetails.name} — selected as the best available option by LI.FI`));
  if (steps.length === 1) {
    console.log(chalk.dim(`    • Single-step route — simpler and less likely to fail`));
  }
  const duration = quote.estimate.executionDuration;
  if (duration <= 60) {
    console.log(chalk.dim(`    • Fast execution (~${duration}s estimated)`));
  }

  // Risk notes
  console.log('');
  console.log(chalk.bold('  ⚠️  Risk Notes:'));
  const gasSymbol = getNativeSymbol(quote.action.fromChainId);
  console.log(chalk.dim(`    • You need ${gasSymbol} on ${fromChain} to pay for gas`));
  if (quote.action.fromChainId !== quote.action.toChainId) {
    console.log(chalk.dim(`    • Cross-chain transfers can take longer during network congestion`));
  }
  console.log(chalk.dim(`    • Slippage tolerance: ${(quote.action.slippage * 100).toFixed(1)}% — volatile tokens may need higher slippage`));
  if (steps.length > 1) {
    console.log(chalk.dim(`    • Multi-step route — if an intermediate step fails, check LI.FI status for recovery`));
  }
  console.log('');
}

export function renderExplainRoutes(routes: AdvancedRoute[]): void {
  if (routes.length === 0) {
    console.log(chalk.red('\n  No routes to explain.\n'));
    return;
  }

  console.log('');
  console.log(chalk.bold('  📖 Routes Explanation'));
  console.log('');

  const best = routes[0]!;
  const toDecimals = best.toToken.decimals;
  const toSymbol = best.toToken.symbol;

  routes.slice(0, 5).forEach((route, i) => {
    const toolName = route.steps.map(s => s.toolDetails.name).join(' + ');
    const toAmount = formatTokenAmount(route.toAmount, toDecimals);
    const gasUSD = route.gasCostUSD ? `$${parseFloat(route.gasCostUSD).toFixed(2)}` : 'N/A';

    console.log(chalk.bold(`  Route #${i + 1}: ${toolName}`));
    console.log(`    Output: ${toAmount} ${toSymbol} ($${parseFloat(route.toAmountUSD).toFixed(2)})`);
    console.log(`    Gas: ${gasUSD}`);

    if (i === 0) {
      console.log(chalk.green(`    → Recommended: best output among available routes`));
    } else {
      const diff = parseFloat(best.toAmountUSD) - parseFloat(route.toAmountUSD);
      if (diff > 0) {
        console.log(chalk.yellow(`    → $${diff.toFixed(2)} less output vs best route`));
      }
    }
    console.log('');
  });
}
