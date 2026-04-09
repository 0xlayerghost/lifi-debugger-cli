import chalk from 'chalk';
import { getStatus } from '../core/lifi-client.js';
import { renderStatus } from '../renderer/status-view.js';

export interface StatusOptions {
  tx: string;
  fromChain?: string;
  toChain?: string;
}

export async function handleStatus(opts: StatusOptions): Promise<void> {
  try {
    console.log(chalk.dim('\n  Checking transaction status...'));

    const status = await getStatus(opts.tx, opts.fromChain, opts.toChain);
    renderStatus(status);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(chalk.red(`\n  Error: ${msg}\n`));
    process.exitCode = 1;
  }
}
