# LI.FI Route Debugger CLI

> A chat-first CLI for debugging, comparing, and explaining LI.FI cross-chain routes.

Instead of reading raw route payloads, developers get an explainable terminal debugger for LI.FI.

![Node.js](https://img.shields.io/badge/Node.js->=18-green)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue)
![License](https://img.shields.io/badge/License-ISC-yellow)

## Features

- **Quote** — Get the best cross-chain route with full breakdown
- **Compare** — Compare multiple routes side-by-side (best output, fastest, cheapest gas)
- **Explain** — Step-by-step plain English explanation of any route
- **Status** — Debug failed or pending transactions with actionable suggestions
- **Export** — Output results as JSON or Markdown for docs, agents, or frontends
- **Chat Mode** — Natural language REPL for interactive debugging

## Installation

### Prerequisites

- [Node.js](https://nodejs.org/) >= 18
- npm (comes with Node.js) or [pnpm](https://pnpm.io/)

### Option 1: Clone and Run (Recommended)

```bash
# 1. Clone the repo
git clone https://github.com/0xlayerghost/lifi-debugger-cli.git
cd lifi-debugger-cli

# 2. Install dependencies
npm install

# 3. Run
npx tsx bin/lifi-debug.ts quote --from Ethereum --to Base --from-token USDC --to-token ETH --amount 100
```

### Option 2: Global Install (use `lifi-debug` anywhere)

```bash
git clone https://github.com/0xlayerghost/lifi-debugger-cli.git
cd lifi-debugger-cli
npm install
npm run build
npm link

# Now use it from anywhere:
lifi-debug chat
```

## Quick Start

```bash
# Get the best route for 100 USDC from Ethereum to Base
npx tsx bin/lifi-debug.ts quote --from Ethereum --to Base --from-token USDC --to-token ETH --amount 100

# Compare all available routes
npx tsx bin/lifi-debug.ts compare --from Arbitrum --to Optimism --from-token USDT --to-token USDC --amount 500

# Enter interactive chat mode
npx tsx bin/lifi-debug.ts chat
```

## Commands

### `quote` — Get best route

```bash
npx tsx bin/lifi-debug.ts quote \
  --from Ethereum \
  --to Base \
  --from-token USDC \
  --to-token ETH \
  --amount 100
```

```
  ✅ Best Route Found

  From:       Ethereum
  To:         Base
  Send:       100 USDC ($99.99)
  Receive:    0.0456 ETH ($99.47)
  Time:       ~35s
  Gas:        $0.06
  Bridge:     CCTPv2 + Mayan

  Route Steps:
    1. 🌉 Bridge Ethereum → Base via CCTPv2 + Mayan

  Debug Notes:
    • Ensure you have ETH on Ethereum for gas
    • Quote may expire — execute promptly after fetching
```

### `compare` — Compare routes

```bash
npx tsx bin/lifi-debug.ts compare \
  --from Arbitrum --to Optimism \
  --from-token USDT --to-token USDC \
  --amount 500
```

```
  📊 Route Comparison: USDT (Arbitrum) → USDC (Optimism)

  #   Bridge/Tool           Output            USD         Gas       Time      Steps Tags
  ──────────────────────────────────────────────────────────────────────────────────────────
  1.  NearIntents           498.70 USDC       $498.65     $0.02     28s       2     BEST
  2.  Relay                 498.65 USDC       $498.61     $0.01     2s        2     FAST CHEAP
  3.  Mayan (Swift)         498.59 USDC       $498.54     $0.02     3s        2
  4.  Eco                   498.44 USDC       $498.39     $0.02     15s       2
```

### `explain` — Understand the route

```bash
npx tsx bin/lifi-debug.ts explain --last
```

```
  📖 Route Explanation

  Step-by-Step:
    1. Approve USDC spending on Ethereum
    2. Bridge from Ethereum to Base via CCTPv2 + Mayan
    3. Receive ETH in your wallet on Base

  Why This Route:
    • Uses CCTPv2 + Mayan — selected as the best available option
    • Single-step route — simpler and less likely to fail

  ⚠️  Risk Notes:
    • You need ETH on Ethereum to pay for gas
    • Cross-chain transfers can take longer during congestion
```

### `status` — Debug transactions

```bash
npx tsx bin/lifi-debug.ts status --tx 0x123abc...def
```

```
  ⏳ Transaction Status: PENDING

  Bridge:     Stargate
  Sending:
    Chain:  Ethereum
    TxHash: 0x123...

  🔍 Debug Suggestions:
    • Transaction is still being processed
    • Cross-chain transfers typically take 2-20 minutes
    • Run this command again in a few minutes to check progress
```

### `export` — Output for other tools

```bash
# Export as machine-readable JSON
npx tsx bin/lifi-debug.ts export --format json

# Export as Markdown (for docs, PRs, or demos)
npx tsx bin/lifi-debug.ts export --format markdown
```

### `chat` — Interactive REPL

```bash
npx tsx bin/lifi-debug.ts chat
```

```
  🔧 LI.FI Route Debugger — Chat Mode

  lifi-debug > bridge 100 USDC from Ethereum to Base
  lifi-debug > compare routes for 500 USDT from Arbitrum to Optimism
  lifi-debug > why this route?
  lifi-debug > show cheaper alternatives
  lifi-debug > export as markdown
  lifi-debug > check status 0x123...
  lifi-debug > exit
```

## Supported Chains

Ethereum, Arbitrum, Optimism, Base, Polygon, BSC, Avalanche, Fantom, Gnosis, zkSync, Linea, Scroll, Mantle, Blast, Mode, Celo, Moonbeam, Aurora, Solana

## Supported Tokens

USDC, USDT, ETH, WETH, DAI, WBTC, BNB, MATIC, AVAX, and more per chain.

You can also pass token contract addresses directly (e.g., `--from-token 0xA0b8...eB48`).

## Architecture

```
bin/lifi-debug.ts              Entry point (Commander CLI)
src/
  commands/                    Command handlers
    quote.ts, compare.ts,      Each command: parse → API call → render
    explain.ts, status.ts,
    export.ts, chat.ts
  core/
    lifi-client.ts             LI.FI REST API wrapper (plain fetch)
    chain-map.ts               Chain name ↔ chainId mapping
    token-map.ts               Token symbol → contract address mapping
    types.ts                   Shared TypeScript interfaces
  parser/
    nl-parser.ts               Natural language → intent + params
  renderer/
    quote-view.ts              Terminal output formatters
    compare-view.ts            (colored tables, step trees,
    explain-view.ts             markdown/JSON export)
    status-view.ts
    export-view.ts
  session/
    store.ts                   In-memory session context
```

## Tech Stack

| Layer | Tool | Why |
|-------|------|-----|
| Runtime | Node.js + TypeScript | Type safety, modern JS |
| CLI Framework | Commander.js | Battle-tested, zero config |
| Terminal Styling | Chalk | Beautiful colored output |
| Validation | Zod | Runtime type checking |
| API | LI.FI REST API | No SDK dependency, plain fetch |

## Development

```bash
# Run in dev mode (auto-compiles TypeScript)
npx tsx bin/lifi-debug.ts <command>

# Build for production
npm run build

# Run built version
npm start -- <command>
```

## License

ISC
