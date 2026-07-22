# GAME-MANIA

Production-ready UK gaming marketplace — buy games, consoles, and accessories, trade in devices, earn rewards, and manage everything from a dedicated admin panel.

| Surface | URL (production) | App | Local |
|---------|------------------|-----|-------|
| Storefront | https://gamemania.com | `frontend/` | http://localhost:3000 |
| Admin | https://admin.gamemania.com | `admin/` | http://localhost:3001 |
| API | https://api.gamemania.com | `backend/` | http://localhost:5000 |

## Tech stack

- **Frontend / Admin:** Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS, shadcn/ui, Framer Motion, Zustand, TanStack Query
- **Backend:** Node.js, Express.js, TypeScript, Prisma ORM
- **Database:** PostgreSQL (native install — **no Docker**)
- **Auth:** JWT + refresh tokens, RBAC, Google OAuth
- **Payments:** Stripe, PayPal
- **Production:** Ubuntu VPS, PM2, Nginx, Let's Encrypt

## Repository layout

```
GAME-MANIA/
├── frontend/          # Customer storefront (Next.js)
├── admin/             # Admin dashboard (Next.js)
├── backend/           # REST API (Express + Prisma)
├── database/          # Prisma schema, migrations, seeds
├── deploy/            # Nginx + PM2 (production, no Docker)
├── docs/              # Architecture & product documentation
├── scripts/           # Dev, deploy, SSL, backup helpers
└── .github/           # Issue/PR templates + CI/CD
```

## Quick start (Windows 11 — no Docker)

1. Install [Node.js LTS](https://nodejs.org/), [PostgreSQL](https://www.postgresql.org/download/windows/), and Git.
2. Create a PostgreSQL user/database matching `.env.example`.
3. Clone this repository and copy environment files:

```powershell
Copy-Item .env.example .env
Copy-Item backend\.env.example backend\.env
Copy-Item frontend\.env.example frontend\.env.local
Copy-Item admin\.env.example admin\.env.local
```

4. Install and run (three terminals):

```powershell
cd backend; npm install; npm run prisma:migrate; npm run dev   # :5000
cd frontend; npm install; npm run dev                           # :3000
cd admin; npm install; npm run dev                              # :3001
```

Optional DB check: `npm run db:check` from the repo root.

Full install steps: [docs/guides/installation.md](docs/guides/installation.md)

## Documentation

| Document | Path |
|----------|------|
| Software Requirements | [docs/requirements/srs.md](docs/requirements/srs.md) |
| Architecture | [docs/architecture/overview.md](docs/architecture/overview.md) |
| Folder structure | [docs/architecture/folder-structure.md](docs/architecture/folder-structure.md) |
| Database design | [docs/database/design.md](docs/database/design.md) |
| REST API | [docs/api/rest-api.md](docs/api/rest-api.md) |
| Roadmap | [docs/architecture/roadmap.md](docs/architecture/roadmap.md) |
| Deployment | [docs/guides/deployment.md](docs/guides/deployment.md) |

## License

MIT — see [LICENSE](LICENSE).

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).
