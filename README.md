# GAME-MANIA

Production-ready UK gaming marketplace — buy games, consoles, and accessories, trade in devices, earn rewards, and manage everything from a dedicated admin panel.

**Live site:** [https://gamemaniaauk.co.uk/](https://gamemaniaauk.co.uk/)

| Surface    | URL (production)                  | App                                 | Local                        |
| ---------- | --------------------------------- | ----------------------------------- | ---------------------------- |
| Storefront | https://gamemaniaauk.co.uk        | `frontend/`                         | http://localhost:3000        |
| Admin      | https://gamemaniaauk.co.uk/admin  | `frontend/` (`/admin`, staff roles) | http://localhost:3000/admin  |
| API        | https://gamemaniaauk.co.uk/api/v1 | `backend/`                          | http://localhost:5000/api/v1 |

## Tech stack

- **Frontend / Admin:** Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS, shadcn/ui, Framer Motion, Zustand, TanStack Query — admin is a role-gated route group under the storefront
- **Backend:** Node.js, Express.js, TypeScript, Prisma ORM
- **Database:** PostgreSQL (native install — **no Docker**)
- **Auth:** JWT + refresh tokens, RBAC, Google OAuth
- **Payments:** Stripe, PayPal
- **Production:** Ubuntu VPS, PM2, Nginx, Let's Encrypt (single host; API proxied at `/api`)

## Repository layout

```
GAME-MANIA/
├── frontend/          # Storefront + /admin staff panel (Next.js)
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
```

4. Install and run (two terminals):

```powershell
cd backend; npm install; npm run prisma:migrate; npm run prisma:seed; npm run dev   # :5000
cd frontend; npm install; npm run dev                                                 # :3000 (store + /admin)
```

Staff admin is at `/admin` (staff roles only). Seed accounts are created by `prisma:seed` — credentials are not published in this README.

Optional DB check: `npm run db:check` from the repo root.

Full install steps: [docs/guides/installation.md](docs/guides/installation.md)

## Documentation

| Document                  | Path                                                                           |
| ------------------------- | ------------------------------------------------------------------------------ |
| Software Requirements     | [docs/requirements/srs.md](docs/requirements/srs.md)                           |
| Architecture              | [docs/architecture/overview.md](docs/architecture/overview.md)                 |
| Folder structure          | [docs/architecture/folder-structure.md](docs/architecture/folder-structure.md) |
| Database design           | [docs/database/design.md](docs/database/design.md)                             |
| REST API                  | [docs/api/rest-api.md](docs/api/rest-api.md)                                   |
| Roadmap                   | [docs/architecture/roadmap.md](docs/architecture/roadmap.md)                   |
| Deployment                | [docs/guides/deployment.md](docs/guides/deployment.md)                         |
| VPS bootstrap (Hostinger) | [docs/guides/vps-bootstrap.md](docs/guides/vps-bootstrap.md)                   |

## License

MIT — see [LICENSE](LICENSE).

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).
