import chalk from 'chalk';
import type { StatusResult } from '../core/types.js';
import { chainIdToName } from '../core/chain-map.js';

export function renderStatus(status: StatusResult): void {
  console.log('');

  const statusIcon = getStatusIcon(status.status);
  const statusColor = getStatusColor(status.status);
  console.log(statusColor(`  ${statusIcon} Transaction Status: ${status.status}`));
  console.log('');

  if (status.substatus) {
    console.log(`  ${chalk.dim('Substatus:')}  ${status.substatus}`);
  }
  if (status.substatusMessage) {
    console.log(`  ${chalk.dim('Message:')}    ${status.substatusMessage}`);
  }
  if (status.tool) {
    console.log(`  ${chalk.dim('Bridge:')}     ${status.tool}`);
  }

  if (status.sending) {
    console.log('');
    console.log(chalk.bold('  Sending:'));
    console.log(`    ${chalk.dim('Chain:')}  ${chainIdToName(status.sending.chainId)}`);
    console.log(`    ${chalk.dim('Token:')}  ${status.sending.token?.symbol ?? 'N/A'}`);
    console.log(`    ${chalk.dim('TxHash:')} ${chalk.cyan(status.sending.txHash)}`);
    if (status.sending.txLink) {
      console.log(`    ${chalk.dim('Link:')}   ${status.sending.txLink}`);
    }
  }

  if (status.receiving) {
    console.log('');
    console.log(chalk.bold('  Receiving:'));
    console.log(`    ${chalk.dim('Chain:')}  ${chainIdToName(status.receiving.chainId)}`);
    console.log(`    ${chalk.dim('Token:')}  ${status.receiving.token?.symbol ?? 'N/A'}`);
    if (status.receiving.txHash) {
      console.log(`    ${chalk.dim('TxHash:')} ${chalk.cyan(status.receiving.txHash)}`);
    }
    if (status.receiving.txLink) {
      console.log(`    ${chalk.dim('Link:')}   ${status.receiving.txLink}`);
    }
  }

  // Debug suggestions for failed/pending
  if (status.status === 'FAILED' || status.status === 'PENDING' || status.status === 'NOT_FOUND') {
    console.log('');
    console.log(chalk.bold('  🔍 Debug Suggestions:'));
    renderDebugSuggestions(status);
  }

  console.log('');
}

function renderDebugSuggestions(status: StatusResult): void {
  switch (status.status) {
    case 'FAILED':
      console.log(chalk.yellow('    • Check if the source transaction was reverted on the block explorer'));
      console.log(chalk.yellow('    • Possible causes: insufficient allowance, expired quote, or low gas'));
      console.log(chalk.yellow('    • If the bridge failed mid-transfer, check if a refund was issued'));
      if (status.substatus === 'PARTIAL') {
        console.log(chalk.yellow('    • Partial delivery detected — some tokens may have arrived'));
      }
      break;
    case 'PENDING':
      console.log(chalk.yellow('    • Transaction is still being processed'));
      console.log(chalk.yellow('    • Cross-chain transfers typically take 2-20 minutes'));
      console.log(chalk.yellow('    • Network congestion can cause delays'));
      console.log(chalk.yellow('    • Run this command again in a few minutes to check progress'));
      break;
    case 'NOT_FOUND':
      console.log(chalk.yellow('    • Transaction not found — it may not have been submitted yet'));
      console.log(chalk.yellow('    • Double-check the transaction hash'));
      console.log(chalk.yellow('    • If just submitted, wait a moment and retry'));
      console.log(chalk.yellow('    • Try providing --from-chain and --to-chain for better lookup'));
      break;
  }
}

function getStatusIcon(status: string): string {
  switch (status) {
    case 'DONE': return '✅';
    case 'FAILED': return '❌';
    case 'PENDING': return '⏳';
    case 'NOT_FOUND': return '🔍';
    default: return '❓';
  }
}

function getStatusColor(status: string): (text: string) => string {
  switch (status) {
    case 'DONE': return chalk.green.bold;
    case 'FAILED': return chalk.red.bold;
    case 'PENDING': return chalk.yellow.bold;
    default: return chalk.dim;
  }
}
