import chalk from 'chalk';
import { getRoutes } from '../core/lifi-client.js';
import { renderCompare } from '../renderer/compare-view.js';
import { saveRoutes, saveParams } from '../session/store.js';

export interface CompareOptions {
  from: string;
  to: string;
  fromToken: string;
  toToken: string;
  amount: string;
}

export async function handleCompare(opts: CompareOptions): Promise<void> {
  try {
    console.log(chalk.dim('\n  Fetching routes for comparison...'));

    const result = await getRoutes({
      fromChain: opts.from,
      toChain: opts.to,
      fromToken: opts.fromToken,
      toToken: opts.toToken,
      amount: opts.amount,
    });

    saveRoutes(result.routes);
    saveParams({
      from: opts.from,
      to: opts.to,
      fromToken: opts.fromToken,
      toToken: opts.toToken,
      amount: opts.amount,
    });

    renderCompare(result.routes);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(chalk.red(`\n  Error: ${msg}\n`));
    process.exitCode = 1;
  }
}
