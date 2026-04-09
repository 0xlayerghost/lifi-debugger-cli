export interface QuoteParams {
  fromChain: string;
  toChain: string;
  fromToken: string;
  toToken: string;
  amount: string;
  fromAddress?: string;
}

export interface RouteParams extends QuoteParams {
  slippage?: number;
}

export interface TokenInfo {
  address: string;
  chainId: number;
  symbol: string;
  decimals: number;
  name: string;
  priceUSD: string;
  logoURI: string;
}

export interface GasCost {
  type: string;
  estimate: string;
  amount: string;
  amountUSD: string;
  token: TokenInfo;
}

export interface FeeCost {
  name: string;
  description: string;
  amount: string;
  amountUSD: string;
  percentage: string;
  included: boolean;
  token: TokenInfo;
}

export interface RouteStep {
  id: string;
  type: string; // 'swap' | 'cross' | 'protocol' | 'custom'
  action: {
    fromChainId: number;
    toChainId: number;
    fromToken: TokenInfo;
    toToken: TokenInfo;
    fromAmount: string;
    fromAddress: string;
    toAddress: string;
  };
  estimate: {
    tool: string;
    fromAmount: string;
    toAmount: string;
    toAmountMin: string;
    gasCosts: GasCost[];
    feeCosts: FeeCost[];
    executionDuration: number;
    approvalAddress: string;
  };
  tool: string;
  toolDetails: {
    key: string;
    name: string;
    logoURI: string;
  };
}

export interface QuoteResult {
  type: string;
  id: string;
  tool: string;
  toolDetails: {
    key: string;
    name: string;
    logoURI: string;
  };
  action: {
    fromToken: TokenInfo;
    toToken: TokenInfo;
    fromChainId: number;
    toChainId: number;
    fromAmount: string;
    slippage: number;
    fromAddress: string;
    toAddress: string;
  };
  estimate: {
    tool: string;
    toAmount: string;
    toAmountMin: string;
    fromAmount: string;
    fromAmountUSD: string;
    toAmountUSD: string;
    gasCosts: GasCost[];
    feeCosts: FeeCost[];
    executionDuration: number;
  };
  includedSteps: RouteStep[];
  integrator: string;
  transactionRequest?: Record<string, unknown>;
}

export interface Route {
  id: string;
  fromToken: TokenInfo;
  toToken: TokenInfo;
  fromAmount: string;
  toAmount: string;
  toAmountMin: string;
  toAmountUSD: string;
  gasCostUSD: string;
  steps: RouteStep[];
  tags: string[];
}

export interface RoutesResult {
  routes: Route[];
}

export interface StatusResult {
  transactionId: string;
  sending: {
    txHash: string;
    txLink: string;
    amount: string;
    token: TokenInfo;
    chainId: number;
  };
  receiving: {
    txHash: string;
    txLink: string;
    amount: string;
    token: TokenInfo;
    chainId: number;
  };
  status: 'NOT_FOUND' | 'INVALID' | 'PENDING' | 'DONE' | 'FAILED';
  substatus?: string;
  substatusMessage?: string;
  tool: string;
  fromAddress: string;
  toAddress: string;
}

export type Intent = 'quote' | 'compare' | 'explain' | 'status' | 'export';

export interface ParsedInput {
  intent: Intent;
  fromChain?: string;
  toChain?: string;
  fromToken?: string;
  toToken?: string;
  amount?: string;
  txHash?: string;
  format?: 'json' | 'markdown';
}
