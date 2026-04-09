import chalk from 'chalk';
import { getLastQuote, getLastRoutes, getLastCommand, getLastResult } from '../session/store.js';
import { exportJSON, exportMarkdownQuote, exportMarkdownRoutes } from '../renderer/export-view.js';

export interface ExportOptions {
  format: string;
}

export async function handleExport(opts: ExportOptions): Promise<void> {
  const format = opts.format?.toLowerCase() ?? 'json';

  if (format !== 'json' && format !== 'markdown' && format !== 'md') {
    console.log(chalk.red(`\n  Unsupported format: "${format}". Use "json" or "markdown".\n`));
    return;
  }

  const lastCmd = getLastCommand();

  if (format === 'json') {
    const data = getLastResult();
    if (!data) {
      console.log(chalk.yellow('\n  No data to export. Run a quote or compare first.\n'));
      return;
    }
    exportJSON(data);
    return;
  }

  // Markdown export
  if (lastCmd === 'quote') {
    const quote = getLastQuote();
    if (quote) {
      exportMarkdownQuote(quote);
      return;
    }
  }

  if (lastCmd === 'compare') {
    const routes = getLastRoutes();
    if (routes) {
      exportMarkdownRoutes(routes);
      return;
    }
  }

  // Fallback
  const quote = getLastQuote();
  if (quote) {
    exportMarkdownQuote(quote);
    return;
  }

  const routes = getLastRoutes();
  if (routes) {
    exportMarkdownRoutes(routes);
    return;
  }

  console.log(chalk.yellow('\n  No data to export. Run a quote or compare first.\n'));
}
