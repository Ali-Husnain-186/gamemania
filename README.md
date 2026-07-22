# GAME-MANIA

Production-ready UK gaming marketplace — buy games, consoles, and accessories, trade in devices, earn rewards, and manage everything from a dedicated admin panel.

| Surface | URL (production) | App |
|---------|------------------|-----|
| Storefront | https://gamemania.com | `frontend/` |
| Admin | https://admin.gamemania.com | `admin/` |
| API | https://api.gamemania.com | `backend/` |

## Tech stack

- **Frontend / Admin:** Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS, shadcn/ui, Framer Motion, Zustand, TanStack Query
- **Backend:** Node.js, Express.js, TypeScript, Prisma ORM
- **Database:** PostgreSQL
- **Auth:** JWT + refresh tokens, RBAC, Google OAuth
- **Payments:** Stripe, PayPal
- **Infra:** Docker Compose, Nginx, Let's Encrypt

## Repository layout

```
GAME-MANIA/
├── frontend/          # Customer storefront (Next.js)
├── admin/             # Admin dashboard (Next.js)
├── backend/           # REST API (Express + Prisma)
├── database/          # Prisma schema, migrations, seeds
├── docs/              # Architecture & product documentation
├── docker/            # Nginx, Postgres init, compose overlays
├── scripts/           # Dev, deploy, SSL helpers
└── .github/           # CI/CD workflows
```

## Quick start (Windows 11 + Docker Desktop)

1. Install [Node.js LTS](https://nodejs.org/), [Docker Desktop](https://www.docker.com/products/docker-desktop/), and Git.
2. Clone this repository and copy environment files:

```powershell
Copy-Item .env.example .env
Copy-Item backend\.env.example backend\.env
Copy-Item frontend\.env.example frontend\.env.local
Copy-Item admin\.env.example admin\.env.local
```

3. Start infrastructure and API:

```powershell
docker compose up -d postgres redis
cd backend; npm install; npx prisma migrate dev --schema ../database/prisma/schema.prisma; npm run dev
```

4. In separate terminals:

```powershell
cd frontend; npm install; npm run dev
cd admin; npm install; npm run dev
```

Full install steps: [docs/guides/installation.md](docs/guides/installation.md)

## Documentation

| Document | Path |
|----------|------|
| Software Requirements | [docs/requirements/srs.md](docs/requirements/srs.md) |
| Architecture | [docs/architecture/overview.md](docs/architecture/overview.md) |
| Database design | [docs/database/design.md](docs/database/design.md) |
| REST API | [docs/api/rest-api.md](docs/api/rest-api.md) |
| Roadmap | [docs/architecture/roadmap.md](docs/architecture/roadmap.md) |
| Deployment | [docs/guides/deployment.md](docs/guides/deployment.md) |

## License

MIT — see [LICENSE](LICENSE).

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).
