import chalk from 'chalk';
import type { AdvancedRoute } from '../core/lifi-client.js';
import { chainIdToName } from '../core/chain-map.js';
import { formatTokenAmount } from '../core/token-map.js';

export function renderCompare(routes: AdvancedRoute[]): void {
  if (routes.length === 0) {
    console.log(chalk.red('\n  No routes found for this request.\n'));
    return;
  }

  const toSymbol = routes[0]!.toToken.symbol;
  const toDecimals = routes[0]!.toToken.decimals;
  const fromSymbol = routes[0]!.fromToken.symbol;
  const fromChain = chainIdToName(routes[0]!.fromToken.chainId);
  const toChain = chainIdToName(routes[0]!.toToken.chainId);

  console.log('');
  console.log(chalk.bold(`  📊 Route Comparison: ${fromSymbol} (${fromChain}) → ${toSymbol} (${toChain})`));
  console.log('');

  // Find best in each category
  let bestOutputIdx = 0;
  let fastestIdx = 0;
  let cheapestGasIdx = 0;

  routes.forEach((route, i) => {
    if (parseFloat(route.toAmountUSD) > parseFloat(routes[bestOutputIdx]!.toAmountUSD)) bestOutputIdx = i;
    const duration = getTotalDuration(route);
    if (duration < getTotalDuration(routes[fastestIdx]!)) fastestIdx = i;
    if (parseFloat(route.gasCostUSD ?? '0') < parseFloat(routes[cheapestGasIdx]!.gasCostUSD ?? '0')) cheapestGasIdx = i;
  });

  // Header
  const header = `  ${'#'.padEnd(4)}${'Bridge/Tool'.padEnd(22)}${'Output'.padEnd(18)}${'USD'.padEnd(12)}${'Gas'.padEnd(10)}${'Time'.padEnd(10)}${'Steps'.padEnd(6)}Tags`;
  console.log(chalk.dim(header));
  console.log(chalk.dim('  ' + '─'.repeat(90)));

  routes.forEach((route, i) => {
    const toAmount = formatTokenAmount(route.toAmount, toDecimals);
    const displayAmount = toAmount.length > 12 ? toAmount.slice(0, 12) + '..' : toAmount;
    const duration = getTotalDuration(route);
    const timeStr = formatDuration(duration);
    const gasUSD = route.gasCostUSD ? `$${parseFloat(route.gasCostUSD).toFixed(2)}` : 'N/A';
    const toolName = getMainTool(route);
    const stepCount = countSteps(route);

    const tags: string[] = [];
    if (i === bestOutputIdx) tags.push(chalk.green('BEST'));
    if (i === fastestIdx) tags.push(chalk.blue('FAST'));
    if (i === cheapestGasIdx) tags.push(chalk.yellow('CHEAP'));

    const num = `${i + 1}.`.padEnd(4);
    const tool = toolName.padEnd(22);
    const amt = `${displayAmount} ${toSymbol}`.padEnd(18);
    const usd = `$${parseFloat(route.toAmountUSD).toFixed(2)}`.padEnd(12);
    const gas = gasUSD.padEnd(10);
    const time = timeStr.padEnd(10);
    const steps = stepCount.toString().padEnd(6);
    const tagStr = tags.join(' ');

    const line = `  ${num}${tool}${amt}${usd}${gas}${time}${steps}${tagStr}`;
    console.log(i === bestOutputIdx ? chalk.white.bold(line) : line);
  });

  console.log('');
  console.log(chalk.bold('  Tradeoff Summary:'));
  if (bestOutputIdx === fastestIdx && bestOutputIdx === cheapestGasIdx) {
    console.log(chalk.green(`    Route #${bestOutputIdx + 1} wins in all categories!`));
  } else {
    console.log(`    ${chalk.green('Best output:')}  Route #${bestOutputIdx + 1} — ${formatTokenAmount(routes[bestOutputIdx]!.toAmount, toDecimals)} ${toSymbol} ($${parseFloat(routes[bestOutputIdx]!.toAmountUSD).toFixed(2)})`);
    console.log(`    ${chalk.blue('Fastest:')}      Route #${fastestIdx + 1} — ${formatDuration(getTotalDuration(routes[fastestIdx]!))}`);
    console.log(`    ${chalk.yellow('Cheapest gas:')} Route #${cheapestGasIdx + 1} — $${parseFloat(routes[cheapestGasIdx]!.gasCostUSD ?? '0').toFixed(2)}`);
  }
  console.log('');
}

function getTotalDuration(route: AdvancedRoute): number {
  return route.steps.reduce((sum, step) => {
    const stepDuration = step.estimate.executionDuration;
    const subDuration = step.includedSteps?.reduce((s, sub) => s + sub.estimate.executionDuration, 0) ?? 0;
    return sum + Math.max(stepDuration, subDuration);
  }, 0);
}

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return s > 0 ? `${m}m ${s}s` : `${m}m`;
}

function getMainTool(route: AdvancedRoute): string {
  const crossStep = route.steps.find(s =>
    s.type === 'cross' || s.includedSteps?.some(sub => sub.type === 'cross')
  );
  if (crossStep) return crossStep.toolDetails.name;
  return route.steps[0]?.toolDetails.name ?? 'Unknown';
}

function countSteps(route: AdvancedRoute): number {
  return route.steps.reduce((sum, step) => {
    return sum + (step.includedSteps?.length ?? 1);
  }, 0);
}
