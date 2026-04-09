import { resolveChainId } from './chain-map.js';
import { resolveTokenAddress, parseAmount } from './token-map.js';
import type { QuoteParams, QuoteResult, StatusResult } from './types.js';

const API_BASE = 'https://li.quest/v1';
const INTEGRATOR = 'Oxlayer';
const DEFAULT_FROM_ADDRESS = '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045';

async function apiFetch<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  if (!res.ok) {
    const body = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(
      `LI.FI API error (${res.status}): ${(body as any).message ?? JSON.stringify(body)}`
    );
  }
  return res.json() as Promise<T>;
}

export async function getQuote(params: QuoteParams): Promise<QuoteResult> {
  const fromChainId = resolveChainId(params.fromChain);
  const toChainId = resolveChainId(params.toChain);
  const fromToken = resolveTokenAddress(params.fromToken, fromChainId);
  const toToken = resolveTokenAddress(params.toToken, toChainId);
  const fromAmount = parseAmount(params.amount, params.fromToken);
  const fromAddress = params.fromAddress ?? DEFAULT_FROM_ADDRESS;

  const qs = new URLSearchParams({
    fromChain: fromChainId.toString(),
    toChain: toChainId.toString(),
    fromToken,
    toToken,
    fromAmount,
    fromAddress,
    integrator: INTEGRATOR,
  });

  return apiFetch<QuoteResult>(`${API_BASE}/quote?${qs}`);
}

export interface AdvancedRoutesResponse {
  routes: AdvancedRoute[];
}

export interface AdvancedRoute {
  id: string;
  fromAmountUSD: string;
  toAmountUSD: string;
  toAmount: string;
  toAmountMin: string;
  fromAmount: string;
  fromToken: { symbol: string; decimals: number; priceUSD: string; chainId: number; address: string };
  toToken: { symbol: string; decimals: number; priceUSD: string; chainId: number; address: string };
  gasCostUSD: string;
  steps: Array<{
    id: string;
    type: string;
    tool: string;
    toolDetails: { key: string; name: string; logoURI: string };
    action: {
      fromChainId: number;
      toChainId: number;
      fromToken: { symbol: string; decimals: number };
      toToken: { symbol: string; decimals: number };
    };
    estimate: {
      tool: string;
      toAmount: string;
      toAmountMin: string;
      fromAmount: string;
      gasCosts: Array<{ amountUSD: string }>;
      executionDuration: number;
    };
    includedSteps?: Array<{
      type: string;
      tool: string;
      toolDetails: { key: string; name: string };
      estimate: {
        executionDuration: number;
        gasCosts: Array<{ amountUSD: string }>;
      };
    }>;
  }>;
  tags: string[];
}

export async function getRoutes(params: QuoteParams): Promise<AdvancedRoutesResponse> {
  const fromChainId = resolveChainId(params.fromChain);
  const toChainId = resolveChainId(params.toChain);
  const fromToken = resolveTokenAddress(params.fromToken, fromChainId);
  const toToken = resolveTokenAddress(params.toToken, toChainId);
  const fromAmount = parseAmount(params.amount, params.fromToken);
  const fromAddress = params.fromAddress ?? DEFAULT_FROM_ADDRESS;

  const body = {
    fromChainId,
    toChainId,
    fromTokenAddress: fromToken,
    toTokenAddress: toToken,
    fromAmount,
    fromAddress,
    options: {
      integrator: INTEGRATOR,
      slippage: 0.005,
      order: 'RECOMMENDED',
    },
  };

  return apiFetch<AdvancedRoutesResponse>(`${API_BASE}/advanced/routes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

export async function getStatus(txHash: string, fromChain?: string, toChain?: string): Promise<StatusResult> {
  const qs = new URLSearchParams({ txHash });
  if (fromChain) qs.set('fromChain', resolveChainId(fromChain).toString());
  if (toChain) qs.set('toChain', resolveChainId(toChain).toString());

  return apiFetch<StatusResult>(`${API_BASE}/status?${qs}`);
}
