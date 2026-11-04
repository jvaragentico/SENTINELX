# Actual validation — 2026-11-05 (Asia/Bangkok)

## Executed successfully
- `npm run typecheck`: exit 0 after clearing generated output from an interrupted build. No source type errors.
- `node node_modules/tsx/dist/cli.mjs --test tests/monitor.test.ts`: 4 passed, 0 failed. Covers exact transfer threshold, stable replay IDs, oracle stale/future/missing timestamps, contribution caps, invalid inputs and zero-work scoring.
- `npm run build`: Next.js 16.4.5 compiled, typechecked and generated all routes successfully. A later route change makes `/api/security` dynamic; hosting build must revalidate that state.
- `npm run test:contracts`: 5 passing groups using solc 0.8.38 and local Ganache chain 31337. Covers deposits/solvency, unauthorized pause, paused deposit rejection, withdrawal delay and availability during pause, double withdrawals, funded delayed Merkle claims, recipient proof binding, epoch immutability, duplicate claims, verifier authorization and evidence replay.
- `npm run test:e2e`: 5 passed in 11.6 seconds using installed Chromium. Navigation, disabled finance actions, simulator math, wallet-absent errors, injected testnet wallet, session profile preview, rejected network switching and 390px mobile overflow check. Wallet provider was a stub; no real wallet transaction was executed.
- Official public RPC `eth_chainId` returned `0xb626` (46630).
- `eth_getCode` returned 2202 and 1681 bytes respectively at the officially documented L2 Gateway Router and L2 Proxy Admin testnet addresses.
- Direct live `getSnapshot()` processed 8 blocks and 19 real transactions at sample head 148586018; both deterministic agents executed; zero configured signals matched.
- `npm run worker -- --once`: checkpoint cursor 148596856 persisted with snapshot `live`; zero signals. Restart/reorg/fault injection tests have not been executed.
- Desktop screenshot visually inspected. Mobile screenshot and automated overflow check performed.

## Failures encountered and resolved
- Initial sandbox test-runner spawn was blocked with EPERM. Reran with execution permission.
- Interrupted compiler output contained null bytes; removed only `.next` and rebuilt successfully.
- Local EVM deployment default gas was insufficient; explicit test deployment gas corrected it.
- Playwright's separate headless-shell binary was absent; configured installed Chromium and reran successfully.

## Dependency findings
Initial full dependency install reported 35 advisories. `npm audit --omit=dev --json` reported 27, all with paths inside the local-only Ganache bundled dependency tree (4 critical, 17 high, 5 moderate, 1 low). Ganache is not imported by the application or monitoring worker. Do not expose the Ganache process or use it with valuable keys. Hosted adapter has its own dependency tree without Ganache. These findings are unresolved in the test tooling and must not be described as a clean audit.

## Not yet verified
Testnet contract deployment/verification, real funded claim, fuzz/invariant and malicious-token suites, admin authorization backend, database RLS, real wallet extension, referral retention/abuse system, external monitoring and production incident recovery. No independent security audit or legal review occurred. See DEVELOPMENT.md for intentionally inactive integrations.

## Hosting
Vercel creation and deployment returned 403; no Vercel deployment was created. Alternative Sites deployment and live test outcomes will be recorded after execution.
