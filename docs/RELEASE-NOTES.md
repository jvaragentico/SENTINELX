# Token-first redesign release

The dashboard now leads with $SNTX utility, an animated illustrative token orbital, token deployment/funding status and a real sampled explorer block strip. Wallet access remains read-only. Motion respects reduced-motion preferences.

Validation executed for this release: Next.js production build and typecheck passed; 4 monitoring-rule tests passed; 5 local smart-contract test groups passed; 8 Chromium application tests passed; desktop/mobile screenshots inspected; production VPS Compose configuration parsed successfully. No deployment to the user's VPS was performed.

Packages: sentinelx-full.zip includes web/API, worker, contracts, tests, Docker/VPS configuration and guides. sentinelx-vercel.zip includes Next.js web/API source and guides; persistent indexing requires a separate host. Both exclude secrets, node_modules, build output, worker state and the Sites checkout.

$SNTX is proposed and undeployed. No sale, mainnet issuance, bonding or public rewards have been activated. Guardian accounts are previews. Existing unresolved test-tool dependency advisories and integration limitations remain documented in SECURITY.md, TEST-REPORT.md and DEVELOPMENT.md.