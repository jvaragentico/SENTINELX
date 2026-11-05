# VPS deployment guide — Ubuntu 24.04 / 26.04 LTS

Use the FULL project ZIP for the web app and persistent worker. The Vercel ZIP is web/API only. Suggested build capacity: 2 CPU cores, 4 GB RAM, 15 GB free disk. Configure SSH keys and retain your current SSH session when changing firewall rules.

## 1. Install Docker
Follow the official Docker Engine + Compose plugin instructions:
https://docs.docker.com/engine/install/ubuntu/

Verify:
~~~sh
sudo docker version
sudo docker compose version
~~~

Point your domain A record to the VPS IPv4 address. Use AAAA only with working IPv6. Permit inbound TCP 80/443 (and your SSH port). The production Compose file exposes only Caddy; port 3000 remains private.

## 2. Upload the full project
~~~sh
scp sentinelx-full.zip your-user@YOUR_SERVER:/tmp/
ssh your-user@YOUR_SERVER
sudo mkdir -p /opt/sentinelx
sudo chown "$USER":"$USER" /opt/sentinelx
unzip /tmp/sentinelx-full.zip -d /opt/sentinelx
cd /opt/sentinelx
~~~

Alternatively clone https://github.com/jvaragentico/SENTINELX.git into an empty project folder.

## 3. Configure
~~~sh
cp .env.example .env
chmod 600 .env
nano .env
~~~
Set:
~~~text
SITE_DOMAIN=sentinel.example.com
ROBINHOOD_RPC_URL=https://rpc.testnet.chain.robinhood.com
~~~
Replace the example domain. A dedicated TESTNET RPC is recommended because the public endpoint is rate limited and can intermittently fail. Expected chain ID is 46630. Never put a seed phrase or signing key here; read-only monitoring does not need one.

## 4. Start the services
~~~sh
sudo docker compose -p sentinelx --env-file .env -f deployment/compose.vps.yaml config --quiet
sudo docker compose -p sentinelx --env-file .env -f deployment/compose.vps.yaml up --build -d
sudo docker compose -p sentinelx --env-file .env -f deployment/compose.vps.yaml ps
~~~
Caddy obtains and renews TLS certificates. DNS and ports 80/443 must work. Stop/reconfigure any preexisting service using those ports first. TLS reference: https://caddyserver.com/docs/automatic-https

## 5. Verify
~~~sh
curl --fail https://YOUR_DOMAIN/api/health
curl --fail https://YOUR_DOMAIN/api/security
sudo docker compose -p sentinelx --env-file .env -f deployment/compose.vps.yaml logs --tail=100 worker
~~~
Health must say service sentinelx / status ok. Security must independently say status live, chainId 46630, and recent blocks. Inspect a returned block in the explorer. Worker logs must show an advancing checkpoint cursor. No alerts does NOT prove safety.

The explorer feed contains sampled actual blocks; the token orbital is illustrative animation. Wallet access is read-only. No $SNTX balance can be reported until a token contract exists.

## 6. Back up the worker
~~~sh
mkdir -p backups
sudo docker compose -p sentinelx --env-file .env -f deployment/compose.vps.yaml stop worker
sudo docker compose -p sentinelx --env-file .env -f deployment/compose.vps.yaml cp worker:/app/data/worker.json backups/worker.json
sudo docker compose -p sentinelx --env-file .env -f deployment/compose.vps.yaml start worker
~~~
The checkpoint appears after the first successful cycle. Copy backups off the VPS; protect .env in an encrypted secret store. Never run docker compose down -v during normal maintenance: it removes persistent volumes. Caddy certificates are in the caddy-data named volume.

## 7. Update and roll back
Back up state and retain the previous source version. For a Git checkout:
~~~sh
git fetch origin
git pull --ff-only origin main
sudo docker compose -p sentinelx --env-file .env -f deployment/compose.vps.yaml up --build -d
~~~
For ZIP releases, extract to a new directory, preserve .env, and use the SAME Compose project name sentinelx. This keeps named volumes across release directories. Roll back with the saved source version and the same project name/environment. Never overwrite a running directory midway through a build.

## 8. Troubleshoot
- TLS: check DNS, IPv6, port conflicts and caddy logs.
- API 503: check RPC availability, chain ID and outbound HTTPS; never display it as healthy.
- Worker lag: check rate limits, disk permissions and cursor progress. Only one worker may write a state file.
- Deep reorg: stop and review the saved anchor; the documented rewind window is limited.
- Memory: add RAM/swap or build the image on a larger machine.
- Set external alerts for both process liveness AND chain freshness.

## Limits
This guide has not been executed on YOUR VPS; no server credentials were provided. The web snapshot API and worker history are separate. Persistent Guardian auth/reputation, oracle/RWA coverage, admin mutations and token/reward deployment remain inactive. $SNTX is the proposed utility token, not an issued asset. No financial feature is authorized by installing the web app. Read DEVELOPMENT.md, docs/SECURITY.md and docs/LAUNCH.md.
