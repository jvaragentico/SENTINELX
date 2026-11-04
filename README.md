# SentinelX — independent Robinhood Chain monitoring

Read-only testnet beta. Not affiliated with Robinhood. Provisional branding; no token sale, yield promise or active rewards.

## Run
Node 22+ and npm required.

```sh
npm ci
npm run dev
```

Open http://localhost:3000. No credentials or wallet needed for public chain observations. Optional server-only RPC configuration is in `.env.example`.

```sh
npm run build
npm start
npm run worker
npm test
npm run test:contracts
npm run test:e2e
```

Install Chromium using `npx playwright install chromium` before browser tests. `TEST_BASE_URL` can target a deployed app. Wallet tests use an explicit injected provider stub; they do not prove real wallet or onchain execution.

## Self-host
`docker compose up --build -d` starts the web app at port 3000 and a separate persistent worker. Put a TLS reverse proxy in front of the web service. Worker data is in the named `worker-data` volume: back it up before updates. Never delete that volume during normal recovery. Inspect `docker compose logs worker` for RPC errors and cursor progress. The worker is not a serverless route. Compose configuration is provided but must be validated on the target host before production use.

## API
- GET `/api/security`: testnet chain ID, sampled head and blocks, scope, agent status and threshold observations. 503 on RPC failure or chain mismatch. Cached up to 30 seconds; `checkedAt` is observation time.
- GET `/api/health`: process liveness only, not RPC or worker health.
- No public write or admin routes are enabled.

## Source and controls
`src/lib/monitor.ts` contains deterministic rules. `scripts/worker.ts` is the dedicated indexer. `contracts/SentinelBeta.sol` is unaudited and undeployed. Financial controls remain disabled. See `DEVELOPMENT.md`, `docs/SECURITY.md`, `docs/LAUNCH.md`, and `docs/TEST-REPORT.md` for actual completion status.

Official parameters verified 2026-11-05: [chain configuration](https://docs.robinhood.com/chain/connecting/), mainnet 4663, testnet 46630, ETH gas. [ERC-8004](https://eips.ethereum.org/EIPS/eip-8004) integration is deferred; no agent registration is claimed.
