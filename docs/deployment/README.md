# Production deployment notes (Hostinger)

Single-site layout: storefront + `/admin` + `/api` on one domain.

See [../guides/deployment.md](../guides/deployment.md) and [../guides/vps-bootstrap.md](../guides/vps-bootstrap.md).

Configs live in:

- `deploy/nginx/` — reverse proxy + TLS (`/` → Next, `/api/` → Express)
- `deploy/pm2/ecosystem.config.js` — API + frontend only (no separate admin process)
- `scripts/deploy/` — update + backup
- `scripts/ssl/` — Let's Encrypt
- `.github/workflows/deploy.yml` — push to `main` → SSH deploy
