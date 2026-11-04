# Security model — unaudited beta

## Boundaries
Browser data and wallet accounts are untrusted. Monitoring RPC may lie or become unavailable; chain-ID validation is necessary but does not establish endpoint honesty. An endpoint outage displays unavailable, never healthy. Signals reflect rule matches, not exploit confirmation. Recent events are provisional. HTML is escaped by React; contract metadata is not executed or sent to an LLM. The app and agents never request custody or approvals.

## Contract trust
SentinelToken mints once on chain 46630 or 31337. Bond vault administrator can pause deposits only; there is no seizure, rescue or slashing function. User withdrawals remain available during pause. Deposit balance deltas reject fee tokens; rebasing tokens are unsupported. Deploy only with the reviewed fixed-supply token. Reward roots are immutable once funded, claims have a two-day delay, leaves bind chain, distributor, epoch, recipient and amount. Duplicate claims and spending above epoch funding are rejected. No admin drain or expiry reclaim exists. Unclaimable allocations may remain locked indefinitely. Root correctness and fairness depend on human review; solvency does not guarantee a correct root. Deploy privileged role to an OpenZeppelin TimelockController governed by an owner-approved multisig; do not substitute an EOA for production. Passport verifiers are trusted to award honest points; one evidence ID can be used once globally.

## Priority risks / unresolved
- No external audit or testnet end-to-end demonstration.
- Browser profiles and quests are previews, not Sybil-resistant or persistent credentials.
- Worker local file storage assumes one writer and reliable disk. Multi-instance operation needs database locking and transactions. Log retention is unbounded and needs archival for long-running production.
- A 64-block rewind cannot safely resolve deeper reorganizations automatically. Stop and resync from a reviewed checkpoint.
- Rule coverage is intentionally limited; no findings does not imply safety.
- Public RPC is rate limited. No configured independent RPC corroboration, alert delivery, on-call monitoring or SLA.
- Website snapshot API and worker storage are not yet integrated. Host uptime is separate from chain coverage.
- Financial interfaces remain disabled; token branding/legal clearance unresolved.

## Incident procedure
Disable affected monitor templates; preserve checkpoint and logs; compare at least two independent RPC providers and explorer evidence; invalidate orphaned provisional observations; restore verified checkpoint; replay idempotently; obtain independent review before any reward root. Pause new bonds if needed, keep withdrawals available. Never publish secrets or automatically execute third-party protocol emergency actions.
