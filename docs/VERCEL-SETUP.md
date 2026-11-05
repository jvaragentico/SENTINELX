# Vercel deployment
Extract sentinelx-vercel.zip into a new folder. package.json must be at its root.

1. Install Node.js 22.
2. Run npm ci, then npm run build.
3. Deploy the folder using Vercel CLI (vercel deploy --prod), or commit its contents to GitHub and import that repository in Vercel.
4. Choose Next.js, install command npm ci, build command npm run build, default output directory, Node.js 22.x.
5. Optional server-only ROBINHOOD_RPC_URL must point to Robinhood Chain TESTNET (46630). The public beta endpoint is rate limited; use a dedicated provider for sustained use.
6. Redeploy after changing environment variables.
7. Verify /api/health AND /api/security. Health is process liveness; security must return live, chainId 46630 and recent blocks. A 503 means unavailable.

The ZIP contains source, not a prebuilt Vercel output directory. No private keys are needed. Never expose private RPC keys through NEXT_PUBLIC_ variables.

The persistent worker is excluded. Run it separately from the FULL ZIP using docs/VPS-SETUP.md. Do not run persistent monitoring inside short-lived API requests.

$SNTX is proposed and undeployed. Artwork is illustrative. There are no active token sales, approvals, deposits or rewards. Mainnet issuance requires separate owner authorization and review.

Official reference: https://vercel.com/docs/deployments
