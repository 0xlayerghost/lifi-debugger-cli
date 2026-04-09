import type { QuoteResult } from '../core/types.js';
import type { AdvancedRoute } from '../core/lifi-client.js';

interface SessionState {
  lastQuote: QuoteResult | null;
  lastRoutes: AdvancedRoute[] | null;
  lastCommand: string | null;
  lastParams: Record<string, string> | null;
}

const state: SessionState = {
  lastQuote: null,
  lastRoutes: null,
  lastCommand: null,
  lastParams: null,
};

export function saveQuote(quote: QuoteResult): void {
  state.lastQuote = quote;
  state.lastCommand = 'quote';
}

export function saveRoutes(routes: AdvancedRoute[]): void {
  state.lastRoutes = routes;
  state.lastCommand = 'compare';
}

export function saveParams(params: Record<string, string>): void {
  state.lastParams = params;
}

export function getLastQuote(): QuoteResult | null {
  return state.lastQuote;
}

export function getLastRoutes(): AdvancedRoute[] | null {
  return state.lastRoutes;
}

export function getLastCommand(): string | null {
  return state.lastCommand;
}

export function getLastParams(): Record<string, string> | null {
  return state.lastParams;
}

export function getLastResult(): QuoteResult | AdvancedRoute[] | null {
  if (state.lastCommand === 'quote') return state.lastQuote;
  if (state.lastCommand === 'compare') return state.lastRoutes;
  return state.lastQuote ?? state.lastRoutes;
}
