import chalk from 'chalk';
import { getLastQuote, getLastRoutes, getLastCommand } from '../session/store.js';
import { renderExplainQuote, renderExplainRoutes } from '../renderer/explain-view.js';

export async function handleExplain(): Promise<void> {
  const lastCmd = getLastCommand();

  if (lastCmd === 'quote') {
    const quote = getLastQuote();
    if (quote) {
      renderExplainQuote(quote);
      return;
    }
  }

  if (lastCmd === 'compare') {
    const routes = getLastRoutes();
    if (routes && routes.length > 0) {
      renderExplainRoutes(routes);
      return;
    }
  }

  // Fallback: try any available data
  const quote = getLastQuote();
  if (quote) {
    renderExplainQuote(quote);
    return;
  }

  const routes = getLastRoutes();
  if (routes && routes.length > 0) {
    renderExplainRoutes(routes);
    return;
  }

  console.log(chalk.yellow('\n  No route data to explain. Run a quote or compare first.\n'));
  console.log(chalk.dim('  Examples:'));
  console.log(chalk.dim('    lifi-debug quote --from Ethereum --to Base --from-token USDC --to-token ETH --amount 100'));
  console.log(chalk.dim('    lifi-debug explain --last\n'));
}
