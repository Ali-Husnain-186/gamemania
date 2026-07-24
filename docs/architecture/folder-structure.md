# GAME-MANIA — Folder Structure

Windows-first monorepo. **No Docker.** Local PostgreSQL + npm workspaces. Production: Ubuntu VPS with Node.js, PM2, Nginx, Let's Encrypt.

```
GAME-MANIA/
├── .github/
│   ├── ISSUE_TEMPLATE/
│   │   ├── bug_report.md
│   │   ├── feature_request.md
│   │   └── config.yml
│   ├── PULL_REQUEST_TEMPLATE.md
│   └── workflows/
│       ├── ci.yml
│       └── deploy.yml
├── backend/                            # REST API (Express + Prisma) :5000
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── services/
│   │   ├── repositories/
│   │   ├── middlewares/
│   │   ├── routes/
│   │   ├── validators/
│   │   ├── dto/
│   │   ├── types/
│   │   ├── exceptions/
│   │   ├── utils/
│   │   ├── logs/
│   │   ├── modules/                   # Feature modules (auth, catalog, …)
│   │   ├── app.ts
│   │   └── server.ts
│   ├── tests/
│   │   ├── unit/
│   │   └── integration/
│   ├── .env.example
│   ├── package.json
│   ├── README.md
│   ├── tsconfig.json
│   ├── eslint.config.mjs
│   └── prettier.config.mjs
├── database/
│   └── prisma/
│       ├── schema.prisma
│       ├── seed.ts
│       └── migrations/
├── deploy/                             # Production (Hostinger VPS — no Docker)
│   ├── nginx/
│   │   ├── nginx.conf
│   │   └── conf.d/
│   │       └── gamemania.conf
│   └── pm2/
│       └── ecosystem.config.js
├── docs/
│   ├── architecture/
│   ├── api/
│   ├── database/
│   ├── deployment/
│   ├── guides/
│   └── requirements/
├── frontend/                           # Storefront + /admin staff panel (Next.js 15) :3000
│   ├── public/
│   ├── src/
│   │   ├── app/
│   │   │   ├── (shop)/
│   │   │   ├── (auth)/
│   │   │   ├── (account)/
│   │   │   ├── (admin)/admin/        # Staff-only panel
│   │   │   └── (marketing)/
│   │   ├── components/                 # ui, layout, shared
│   │   ├── features/                   # auth, catalog, cart, admin, …
│   │   ├── hooks/
│   │   ├── lib/
│   │   ├── providers/
│   │   ├── stores/
│   │   ├── styles/
│   │   └── types/
│   ├── .env.example
│   ├── package.json
│   ├── README.md
│   ├── tsconfig.json
│   ├── eslint.config.mjs
│   └── prettier.config.mjs
├── scripts/
│   ├── backup/
│   ├── deploy/
│   ├── dev/                            # Windows helpers (PostgreSQL check)
│   ├── monitoring/
│   └── ssl/
├── .env.example
├── .gitignore
├── .prettierrc.json
├── CONTRIBUTING.md
├── LICENSE
├── package.json
└── README.md
```

## Dev ports

| App                   | Port | Command                      |
| --------------------- | ---- | ---------------------------- |
| Storefront + `/admin` | 3000 | `cd frontend && npm run dev` |
| API                   | 5000 | `cd backend && npm run dev`  |

## Ownership rules

| Path        | Owns                                          |
| ----------- | --------------------------------------------- |
| `frontend/` | Public UX, SEO, cart UI, staff `/admin` panel |
| `backend/`  | Business rules & persistence API              |
| `database/` | Single source of truth for schema             |
| `docs/`     | Specs — update when behaviour changes         |
| `deploy/`   | Nginx + PM2 production configs                |
| `scripts/`  | Automation only — no business logic           |
