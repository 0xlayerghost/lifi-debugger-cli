import type { ParsedInput, Intent } from '../core/types.js';

// Regex patterns for natural language parsing
const QUOTE_PATTERN =
  /(?:bridge|swap|send|transfer|move|convert)\s+(\d+(?:\.\d+)?)\s+(\w+(?:\.\w+)?)\s+(?:from\s+)?(\w+)\s+(?:to\s+)(\w+)(?:\s+(?:to|for|into)\s+(\w+(?:\.\w+)?))?/i;

const COMPARE_PATTERN =
  /(?:compare|show|list|find)\s+(?:routes?\s+)?(?:for\s+)?(\d+(?:\.\d+)?)\s+(\w+(?:\.\w+)?)\s+(?:from\s+)?(\w+)\s+(?:to\s+)(\w+)(?:\s+(?:to|for|into)\s+(\w+(?:\.\w+)?))?/i;

const STATUS_PATTERN =
  /(?:check|status|track|monitor)\s+(?:status\s+)?(?:of\s+)?(?:tx\s+)?(0x[a-fA-F0-9]{10,})/i;

const EXPORT_PATTERN =
  /(?:export|save|output|download|dump)\s+(?:(?:last\s+)?(?:result|route|data|it|this)\s+)?(?:as\s+|in\s+)?(\w+)?/i;

const EXPLAIN_PATTERN =
  /(?:explain|why|how|tell\s+me|describe|breakdown|detail)/i;

// Context follow-up patterns (no explicit intent, references previous result)
const FOLLOWUP_EXPLAIN =
  /(?:why\s+(?:this|that|it)|what.+(?:mean|route)|explain|how\s+does|tell\s+me\s+(?:more|about|why))/i;

const FOLLOWUP_CHEAPER =
  /(?:cheap|less\s+gas|lower\s+(?:fee|cost|gas)|afford|budget|save)/i;

const FOLLOWUP_FASTER =
  /(?:fast|quick|speed|hurry)/i;

const FOLLOWUP_EXPORT =
  /(?:export\s+(?:it|this|last)|save\s+(?:it|this)|(?:as|to)\s+(?:json|markdown|md))/i;

export function parseNaturalLanguage(input: string): ParsedInput | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  // Direct command shortcuts
  if (trimmed.toLowerCase() === 'help') {
    return null; // Let the caller handle help
  }

  // Status check
  const statusMatch = trimmed.match(STATUS_PATTERN);
  if (statusMatch) {
    return {
      intent: 'status',
      txHash: statusMatch[1],
    };
  }

  // Compare routes
  const compareMatch = trimmed.match(COMPARE_PATTERN);
  if (compareMatch) {
    return {
      intent: 'compare',
      amount: compareMatch[1],
      fromToken: compareMatch[2],
      fromChain: compareMatch[3],
      toChain: compareMatch[4],
      toToken: compareMatch[5] ?? compareMatch[2], // Default: same token
    };
  }

  // Quote / bridge / swap
  const quoteMatch = trimmed.match(QUOTE_PATTERN);
  if (quoteMatch) {
    return {
      intent: 'quote',
      amount: quoteMatch[1],
      fromToken: quoteMatch[2],
      fromChain: quoteMatch[3],
      toChain: quoteMatch[4],
      toToken: quoteMatch[5] ?? quoteMatch[2], // Default: same token
    };
  }

  // Export
  const exportMatch = trimmed.match(EXPORT_PATTERN);
  if (exportMatch && /export|save|output|dump/i.test(trimmed)) {
    const formatStr = exportMatch[1]?.toLowerCase();
    let format: 'json' | 'markdown' = 'json';
    if (formatStr === 'markdown' || formatStr === 'md') format = 'markdown';
    return { intent: 'export', format };
  }

  // Follow-up: export
  if (FOLLOWUP_EXPORT.test(trimmed)) {
    const format = /markdown|md/i.test(trimmed) ? 'markdown' as const : 'json' as const;
    return { intent: 'export', format };
  }

  // Explain (explicit or follow-up)
  if (EXPLAIN_PATTERN.test(trimmed) || FOLLOWUP_EXPLAIN.test(trimmed)) {
    return { intent: 'explain' };
  }

  // Follow-up: cheaper → compare with implicit context
  if (FOLLOWUP_CHEAPER.test(trimmed)) {
    return { intent: 'compare' }; // Will use last params from session
  }

  // Follow-up: faster → compare with implicit context
  if (FOLLOWUP_FASTER.test(trimmed)) {
    return { intent: 'compare' }; // Will use last params from session
  }

  return null;
}
