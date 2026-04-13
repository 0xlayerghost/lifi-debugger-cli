# LI.FI Route Debugger CLI — 视频讲解稿

---

## 第一部分：开场介绍（1-2 min）

### 项目背景

大家好，今天给大家介绍一个跨链路由调试的 CLI 工具 — LI.FI Route Debugger CLI。

在 DeFi 开发中，跨链桥接是一个非常常见的需求。比如你想把 Ethereum 上的 USDC 转到 Base 链上换成 ETH，你需要选择一个桥接方案。但问题是：市面上有几十个桥接协议，每个协议的费用、速度、滑点都不一样。LI.FI 就是一个跨链聚合器，它帮你从所有可用的桥和 DEX 中找到最优路径。

但是 LI.FI API 返回的路由数据是非常复杂的 JSON，直接看原始数据很难理解。所以我开发了这个 CLI 工具，它做的事情就是：**把复杂的跨链路由数据变成人类可读的终端输出**，帮助开发者快速调试和理解路由。

### 核心能力

这个 CLI 提供了 6 个核心命令：

1. **quote** — 获取最优路由，告诉你应该走哪条路
2. **compare** — 把所有可用路由放在一起对比，让你自己选
3. **explain** — 用大白话解释一条路由到底做了什么
4. **status** — 查交易状态，帮你调试失败或 pending 的跨链交易
5. **export** — 把结果导出成 JSON 或 Markdown，方便写文档或给其他程序用
6. **chat** — 最核心的功能，进入自然语言交互模式，直接用人话和它对话

### 技术栈

- **运行时**: Node.js + TypeScript — 类型安全，现代 JS
- **CLI 框架**: Commander.js — 最成熟的 Node CLI 框架，零配置
- **终端美化**: Chalk — 彩色输出，让终端不再单调
- **数据校验**: Zod — 运行时类型检查，防止脏数据
- **API**: 直接调 LI.FI REST API，不依赖任何 SDK，就是原生 fetch

---

## 第二部分：项目架构（2 min）

### 整体数据流

```
用户输入（命令行参数 或 自然语言）
    ↓
Commander.js 解析参数 / nl-parser.ts 正则解析意图
    ↓
命令处理器（quote.ts / compare.ts / ...）
    ↓
核心层：链名解析（chain-map.ts）+ 代币解析（token-map.ts）
    ↓
lifi-client.ts 发起 HTTP 请求到 LI.FI API
    ↓
渲染器（quote-view.ts / compare-view.ts / ...）格式化输出
    ↓
终端彩色输出
    ↕
session/store.ts 保存会话状态（支持上下文追问）
```

### 目录结构

```
bin/lifi-debug.ts              ← CLI 入口，Commander 注册 6 个命令
src/
  commands/                    ← 命令处理器（每个命令一个文件）
    quote.ts                      获取最优路由
    compare.ts                    对比所有路由
    explain.ts                    解释路由
    status.ts                     交易状态查询
    export.ts                     导出 JSON/Markdown
    chat.ts                       自然语言交互 REPL
  core/                        ← 核心业务逻辑
    lifi-client.ts                LI.FI REST API 封装
    chain-map.ts                  链名 ↔ chainId 映射（支持 19 条链）
    token-map.ts                  代币符号 → 合约地址映射
    types.ts                      TypeScript 类型定义
  parser/                      ← 自然语言解析
    nl-parser.ts                  正则意图识别 + 参数提取
  renderer/                    ← 终端渲染层
    quote-view.ts                 Quote 彩色渲染
    compare-view.ts               路由对比表格
    explain-view.ts               路由解释
    status-view.ts                交易状态展示
    export-view.ts                JSON/Markdown 导出
  session/                     ← 会话管理
    store.ts                      内存存储（lastQuote, lastRoutes, lastParams）
```

架构的核心思想是**关注点分离**：命令层只负责流程编排，核心层负责数据获取和转换，渲染层只负责输出格式化。每一层都可以独立替换和测试。

---

## 第三部分：命令演示（5-6 min）

### 演示 1：quote — 获取最优路由

这是最基础的命令。假设我要把 Ethereum 上的 100 USDC 跨链到 Base 上换成 ETH，我只需要这一行命令：

```bash
npx tsx bin/lifi-debug.ts quote --from Ethereum --to Base --from-token USDC --to-token ETH --amount 100
```

**预期输出**:

```
  ✅ Best Route Found

  From:       Ethereum
  To:         Base
  Send:       100 USDC ($99.98)
  Receive:    0.0456 ETH ($99.79)
  Min receive: 0.0454 ETH
  Time:       ~4s
  Gas:        $0.10
  Fee:        $0.31
  Bridge:     Relay
  Slippage:   0.5%

  Route Steps:
    1. 🌉 Bridge Ethereum → Base via Relay

  Debug Notes:
    • Ensure you have ETH on Ethereum for gas
    • Quote may expire — execute promptly after fetching
```

**来讲解一下输出的每个字段**：

- **From / To** — 源链和目标链
- **Send / Receive** — 发送金额和预计接收金额，括号里是美元价值，可以直观看到跨链损耗
- **Min receive** — 考虑滑点后的最低接收金额，这是你最坏情况下能拿到的
- **Time** — 预计执行时间，这里 Relay 桥只需要 4 秒，非常快
- **Gas / Fee** — Gas 费和协议费用，分开展示让你知道钱花在哪
- **Bridge** — 选择了哪个桥接协议
- **Route Steps** — 路由步骤的可视化，🌉 表示桥接，🔄 表示链上 swap
- **Debug Notes** — 调试提示，提醒你需要在源链有 Gas 费，报价可能过期等

---

### 演示 2：compare — 对比所有可用路由

如果我不想只看最优的，而是想看所有可用的路由来自己做对比，用 compare：

```bash
npx tsx bin/lifi-debug.ts compare --from Arbitrum --to Optimism --from-token USDT --to-token USDC --amount 500
```

**预期输出**:

```
  📊 Route Comparison: USDT (Arbitrum) → USDC (Optimism)

  #   Bridge/Tool           Output            USD         Gas       Time      Steps Tags
  ──────────────────────────────────────────────────────────────────────────────────────────
  1.  NearIntents           498.70 USDC       $498.65     $0.02     28s       2     BEST
  2.  Relay                 498.65 USDC       $498.61     $0.01     2s        2     FAST CHEAP
  3.  Mayan (Swift)         498.59 USDC       $498.54     $0.02     3s        2
  4.  Eco                   498.44 USDC       $498.39     $0.02     15s       2
```

**关注一下 Tags 列**：

- **BEST** — 产出最高的路由，也就是你拿到的代币最多
- **FAST** — 速度最快的路由
- **CHEAP** — Gas 费最低的路由

这三个标签可以帮你快速做决策。比如这里你会发现 NearIntents 虽然产出最多，但要 28 秒；而 Relay 只要 2 秒而且 Gas 最低，差价只有 0.05 USDC，很多时候 Relay 反而是更好的选择。这就是 compare 的价值 — 让你不只看"最优"，而是看到完整的权衡。

---

### 演示 3：status — 调试交易状态

当你发起了一笔跨链交易，但不知道它到底有没有完成，可以用 status 来查：

```bash
npx tsx bin/lifi-debug.ts status --tx 0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef
```

> **注意**: status 只能追踪通过 LI.FI 协议发起的跨链交易。如果传入一个非 LI.FI 交易的 hash，API 会返回 404。在实际使用中，如果交易正在进行，它会显示 PENDING 状态和预计等待时间；如果交易失败，会给出具体的调试建议（比如检查 Gas 是否充足、授权是否到位、报价是否过期等）。

可选参数 `--from-chain` 和 `--to-chain` 可以加快查询速度：

```bash
npx tsx bin/lifi-debug.ts status --tx 0xabc...def --from-chain Ethereum --to-chain Base
```

**交易状态类型**:

| 状态 | 含义 | 调试建议 |
|------|------|---------|
| DONE | 交易已完成 | 检查接收钱包余额 |
| PENDING | 正在处理中 | 跨链通常需要 2-20 分钟，等待即可 |
| FAILED | 交易失败 | 检查 Gas、授权、报价过期、合约 revert |
| NOT_FOUND | 找不到交易 | 确认 hash 是否正确，是否为 LI.FI 交易 |

---

### 演示 4：chat — 自然语言交互模式（核心亮点）

这是整个工具最有意思的功能。进入 chat 模式后，你不需要记任何命令格式，直接用自然语言和它对话：

```bash
npx tsx bin/lifi-debug.ts chat
```

进入后会看到一个交互式提示符，然后你可以这样输入：

```
🔧 LI.FI Route Debugger — Chat Mode

lifi-debug > bridge 100 USDC from Ethereum to Base
（会返回 quote 结果）

lifi-debug > why this route?
（会解释为什么选择这条路由）

lifi-debug > compare routes for 500 USDT from Arbitrum to Optimism
（会返回路由对比表格）

lifi-debug > show cheaper alternatives
（会自动复用上一次的参数，展示更便宜的选项）

lifi-debug > export as markdown
（会把上一次结果导出为 Markdown 格式）

lifi-debug > help
（显示帮助信息）

lifi-debug > exit
（退出）
```

**为什么这个功能重要？**

1. **不用记命令格式** — 直接用自然语言描述你想做什么
2. **支持上下文追问** — 问完 "bridge 100 USDC from Ethereum to Base" 之后，直接问 "why?" 或 "show cheaper options"，它会自动复用之前的参数
3. **Session 串联** — explain 和 export 命令单独执行是无法工作的（因为跨进程内存不共享），但在 chat 模式中它们可以完美串联，因为 session 在同一个进程内

**自然语言解析支持的表达方式**:

| 你说的话 | 被解析为 |
|---------|---------|
| "bridge 100 USDC from Ethereum to Base" | quote 命令 |
| "swap 50 ETH from Arbitrum to Optimism" | quote 命令 |
| "compare routes for 500 USDT from Arbitrum to Optimism" | compare 命令 |
| "show routes from Base to Optimism" | compare 命令 |
| "why this route?" / "explain" | explain 命令 |
| "show cheaper alternatives" | compare（复用上次参数） |
| "export as json" / "save as markdown" | export 命令 |
| "check status 0x123..." / "track 0x..." | status 命令 |

---

### 演示 5：explain & export（在 chat 中演示）

explain 和 export 依赖内存 session，所以在 chat 模式中演示：

```
lifi-debug > bridge 100 USDC from Ethereum to Base
（先获取路由）

lifi-debug > why this route?
```

**explain 输出示例**:

```
  📖 Route Explanation

  Step-by-Step:
    1. Approve USDC spending on Ethereum
    2. Bridge from Ethereum to Base via Relay
    3. Receive ETH in your wallet on Base

  Why This Route:
    • Uses Relay — selected as the best available option
    • Single-step route — simpler and less likely to fail

  ⚠️ Risk Notes:
    • You need ETH on Ethereum to pay for gas
    • Cross-chain transfers can take longer during congestion
```

然后导出：

```
lifi-debug > export as markdown
```

会输出格式化的 Markdown，可以直接粘贴到 PR 或文档中。JSON 格式则适合给前端或 AI Agent 消费。

---

## 第四部分：核心代码走读（3-4 min）

### 4.1 lifi-client.ts — API 封装层

这个文件是整个工具和 LI.FI 交互的核心。几个重要的设计点：

- **API 基地址**: `https://li.quest/v1`
- **三个端点**:
  - `GET /quote` — 获取单条最优路由
  - `POST /advanced/routes` — 获取所有可用路由（请求体包含链、代币、金额等参数）
  - `GET /status` — 查询交易状态
- **默认地址**: 用的是 Vitalik 的地址 `0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045`，因为这只是查询报价，不需要真实钱包
- **错误处理**: 用 `apiFetch()` 统一包装，把 HTTP 错误和 API 错误转换成可读的错误信息
- **金额处理**: 用 BigInt 而不是浮点数来处理金额，避免精度丢失。比如 100 USDC 实际上要转换成 `100000000`（6 位小数），这里用字符串拼接 + BigInt 来确保精度

### 4.2 nl-parser.ts — 自然语言解析器

这是 chat 模式的核心。它用正则表达式来做意图识别和参数提取，没有用任何 AI/ML：

- **解析优先级**: status → compare → quote → export → explain → follow-up
- **参数提取**: 从自然语言中提取 amount、fromToken、fromChain、toChain、toToken 五个参数
- **智能默认值**: 如果用户只说了 fromToken 没说 toToken，默认 toToken = fromToken
- **Follow-up 支持**: "show cheaper" 会被解析为 compare 意图，并从 session 中复用上次的参数
- **容错设计**: 支持多种表达方式（bridge/swap/send/transfer 都能触发 quote）

### 4.3 store.ts — 会话管理

非常简洁的实现，就是一个全局对象：

```typescript
SessionState = {
  lastQuote: QuoteResult | null     // 上次 quote 结果
  lastRoutes: AdvancedRoute[] | null // 上次 compare 结果
  lastCommand: 'quote' | 'compare'  // 上次执行的命令类型
  lastParams: { from, to, ... }     // 上次的查询参数
}
```

这个设计让 explain 可以知道该解释什么，export 可以知道该导出什么，follow-up 命令可以复用参数。缺点是只存在内存中，进程退出就丢失，所以跨命令行调用时 explain 和 export 不生效。

### 4.4 chain-map.ts — 链名解析

支持 19 条链的映射，核心是 `resolveChainId()` 函数，有三种解析策略：

1. **精确匹配** — "ethereum" → 1
2. **数字直接用** — "42161" → 42161
3. **模糊前缀匹配** — "eth" → ethereum → 1, "arb" → arbitrum → 42161

还有一个 `getNativeSymbol()` 函数，返回每条链的原生代币符号（Ethereum → ETH, BSC → BNB, Polygon → POL），用于 Gas 费提示。

### 4.5 token-map.ts — 代币解析

管理每条链上的代币合约地址映射。几个有意思的点：

- **零地址约定**: 原生代币（ETH、BNB 等）统一用 `0x0000...0000` 表示
- **链差异处理**: 同一个代币在不同链上地址不同。比如 USDC 在 Ethereum 是一个地址，在 Arbitrum 可能还有 USDC.e（桥接版本）
- **精度处理**: 稳定币是 6 位小数，WBTC 是 8 位，其他默认 18 位。这决定了金额怎么转换
- **智能回退**: 如果符号找不到但输入是 0x 开头，直接当合约地址用

---

## 第五部分：总结（1 min）

### 技术亮点

1. **分层架构** — commands / core / parser / renderer / session 五层分离，每层职责清晰
2. **自然语言交互** — 不依赖 AI，用正则实现轻量级意图解析，响应速度快
3. **会话上下文** — 支持追问和参数复用，减少重复输入
4. **零 SDK 依赖** — 直接用 fetch 调 LI.FI API，没有额外的运行时依赖
5. **类型安全** — 全 TypeScript + Zod 校验，从编译期到运行时都有类型保护

### 可扩展方向

- **接入 LLM** — chat 模式目前用正则解析，未来可以接入 Claude/GPT 做更智能的意图理解
- **Session 持久化** — 把会话状态写到本地文件，让 explain/export 跨命令也能工作
- **更多链支持** — chain-map 和 token-map 是纯配置，加链加代币只需要加几行映射
- **交易执行** — 目前只是查询和调试，未来可以集成钱包签名直接执行交易

---

## 附录：快速命令参考

```bash
# 安装
cd lifi-debugger-cli && npm install

# 获取最优路由
npx tsx bin/lifi-debug.ts quote --from Ethereum --to Base --from-token USDC --to-token ETH --amount 100

# 对比所有路由
npx tsx bin/lifi-debug.ts compare --from Arbitrum --to Optimism --from-token USDT --to-token USDC --amount 500

# 查交易状态
npx tsx bin/lifi-debug.ts status --tx 0xabc...def

# 进入 chat 模式（推荐）
npx tsx bin/lifi-debug.ts chat
```

### 支持的链

Ethereum, Arbitrum, Optimism, Base, Polygon, BSC, Avalanche, Fantom, Gnosis, zkSync, Linea, Scroll, Mantle, Blast, Mode, Celo, Moonbeam, Aurora, Solana

### 支持的代币

USDC, USDT, ETH, WETH, DAI, WBTC, BNB, MATIC, AVAX 等，也支持直接传合约地址 `--from-token 0xA0b8...eB48`
