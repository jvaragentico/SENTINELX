# Development and launch status

SentinelX is a provisional name: existing security products use SentinelX, including sentinelx.ai and sentinel-x-ai.gitbook.io. This is not a trademark clearance. SNTX symbol clearance remains pending. No issuance is authorized.

## Milestone 1 — read-only vertical slice
- Implemented Next.js dashboard, responsive navigation, public testnet RPC reads, chain ID validation, inspectable block/transaction links, deterministic Contract and Transaction Guardian rules.
- Coverage is narrow: 8 recent blocks, two canonical protocol contracts, 10 ETH native-transfer threshold. No oracle or RWA feed configured. No whole-chain safety claim.
- Separate durable worker catches up in bounded batches, checkpoints atomically, deduplicates signals, detects anchor changes and rewinds 64 blocks. Twelve-block lag is a confirmation heuristic, not an L1 finality guarantee. Deep-reorg recovery requires operator intervention. Worker state is not served by the public snapshot API yet.
- Self-host via Docker Compose; web and worker are separate processes. Public Vercel web deployment does not host the persistent worker.

## Milestone 2 — participation
- Wallet connection, chain switching, free session profile and educational evidence quest implemented as clearly labeled previews.
- Authenticated persistent profiles, signed submissions, independent validation, reputation publishing, retention scoring and anti-Sybil backend remain unimplemented. No reputation is issued by the browser.

## Milestone 3 — testnet finance
- Solidity fixed-supply test token, bond vault, funded delayed Merkle rewards and non-transferable reputation ledger are source implementations.
- Contract deployment, explorer verification, funded testnet reward demonstration and independent review remain pending. No deployed addresses exist. No financial UI action enabled.

## Milestone 4 — launch readiness
- Threat model, environment template, self-host configuration and CI provided.
- No legal review or independent security audit. Mainnet minting, token sales, liquidity and public rewards disabled.
- Admin mutation UI is intentionally absent until strong authentication, authorization and durable immutable audit storage are integrated. Public endpoints are GET-only.

## Score specification
Score = floor(min(useful,100) × min(reputation,2) × sqrt(min(bond,10000)) × min(uptime,1) × min(fraud,1) × 1000) / 1000. Inputs must be finite and nonnegative; useful is independently verified outputs per epoch; bond is eligible normalized token units. Zero useful work gives zero score. Scores are only allocation weights, never entitlement beyond actual funded budgets. Production allocation requires integer fixed-point arithmetic, reviewed eligibility snapshots and independent dispute review; the JavaScript helper is a prototype model.

## Deferred integration decisions
Supabase/Postgres, strong auth, append-only external audit storage, ERC-8004 registry deployment, oracle feed canonicality, RWA identifiers, queue coordination, LLM summaries and paid monitoring require verified configuration. No fake keys or addresses are supplied. AI is not used for critical decisions. Database integration is not active in this slice.
