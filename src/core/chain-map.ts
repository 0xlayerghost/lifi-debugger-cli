const CHAIN_MAP: Record<string, number> = {
  ethereum: 1,
  eth: 1,
  arbitrum: 42161,
  arb: 42161,
  optimism: 10,
  op: 10,
  base: 8453,
  polygon: 137,
  matic: 137,
  bsc: 56,
  bnb: 56,
  avalanche: 43114,
  avax: 43114,
  fantom: 250,
  ftm: 250,
  gnosis: 100,
  zksync: 324,
  linea: 59144,
  scroll: 534352,
  mantle: 5000,
  blast: 81457,
  mode: 34443,
  celo: 42220,
  moonbeam: 1284,
  aurora: 1313161554,
  solana: 1151111081099710,
  sol: 1151111081099710,
};

const CHAIN_ID_TO_NAME: Record<number, string> = {
  1: 'Ethereum',
  42161: 'Arbitrum',
  10: 'Optimism',
  8453: 'Base',
  137: 'Polygon',
  56: 'BSC',
  43114: 'Avalanche',
  250: 'Fantom',
  100: 'Gnosis',
  324: 'zkSync',
  59144: 'Linea',
  534352: 'Scroll',
  5000: 'Mantle',
  81457: 'Blast',
  34443: 'Mode',
  42220: 'Celo',
  1284: 'Moonbeam',
  1313161554: 'Aurora',
  1151111081099710: 'Solana',
};

export function resolveChainId(input: string): number {
  const key = input.toLowerCase().trim();
  const id = CHAIN_MAP[key];
  if (id !== undefined) return id;

  // Try parsing as number
  const num = parseInt(key, 10);
  if (!isNaN(num) && CHAIN_ID_TO_NAME[num]) return num;

  // Fuzzy match
  const candidates = Object.keys(CHAIN_MAP);
  const match = candidates.find(
    (c) => c.startsWith(key) || key.startsWith(c)
  );
  if (match) return CHAIN_MAP[match]!;

  throw new Error(
    `Unknown chain: "${input}". Supported: ${Object.keys(CHAIN_MAP).filter((k) => k.length > 3).join(', ')}`
  );
}

export function chainIdToName(id: number): string {
  return CHAIN_ID_TO_NAME[id] ?? `Chain ${id}`;
}

export function getNativeSymbol(chainId: number): string {
  switch (chainId) {
    case 56: return 'BNB';
    case 137: return 'MATIC';
    case 43114: return 'AVAX';
    case 250: return 'FTM';
    case 100: return 'xDAI';
    case 42220: return 'CELO';
    case 1284: return 'GLMR';
    default: return 'ETH';
  }
}
