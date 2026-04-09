import chalk from 'chalk';
import { getQuote } from '../core/lifi-client.js';
import { renderQuote } from '../renderer/quote-view.js';
import { saveQuote, saveParams } from '../session/store.js';

export interface QuoteOptions {
  from: string;
  to: string;
  fromToken: string;
  toToken: string;
  amount: string;
}

export async function handleQuote(opts: QuoteOptions): Promise<void> {
  try {
    console.log(chalk.dim('\n  Fetching best route...'));

    const quote = await getQuote({
      fromChain: opts.from,
      toChain: opts.to,
      fromToken: opts.fromToken,
      toToken: opts.toToken,
      amount: opts.amount,
    });

    saveQuote(quote);
    saveParams({
      from: opts.from,
      to: opts.to,
      fromToken: opts.fromToken,
      toToken: opts.toToken,
      amount: opts.amount,
    });

    renderQuote(quote);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(chalk.red(`\n  Error: ${msg}\n`));
    process.exitCode = 1;
  }
}
