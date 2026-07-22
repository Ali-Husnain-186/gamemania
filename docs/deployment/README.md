# Production deployment notes (Hostinger)

See [../guides/deployment.md](../guides/deployment.md) for the current runbook.

Configs live in:

- `deploy/nginx/` — reverse proxy + TLS
- `deploy/pm2/ecosystem.config.js` — process manager
- `scripts/deploy/` — update + backup
- `scripts/ssl/` — Let's Encrypt
