# GAME-MANIA — Folder Structure

```
GAME-MANIA/
├── .github/
│   └── workflows/
│       ├── ci.yml
│       └── deploy.yml
├── admin/                          # Admin dashboard (Next.js 15)
│   ├── public/
│   ├── src/
│   │   ├── app/
│   │   ├── components/
│   │   ├── features/
│   │   ├── hooks/
│   │   ├── lib/
│   │   ├── stores/
│   │   └── types/
│   ├── Dockerfile
│   ├── .env.example
│   ├── package.json
│   ├── README.md
│   ├── tsconfig.json
│   ├── eslint.config.mjs
│   └── prettier.config.mjs
├── backend/                        # REST API (Express + Prisma)
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
│   │   ├── modules/               # Feature modules (optional co-location)
│   │   ├── app.ts
│   │   └── server.ts
│   ├── tests/
│   ├── Dockerfile
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
├── docker/
│   ├── nginx/
│   │   ├── nginx.conf
│   │   └── conf.d/
│   │       └── gamemania.conf
│   └── postgres/
│       └── init.sql
├── docs/
│   ├── architecture/
│   ├── api/
│   ├── database/
│   ├── guides/
│   └── requirements/
├── frontend/                       # Customer storefront (Next.js 15)
│   ├── public/
│   ├── src/
│   │   ├── app/
│   │   ├── components/
│   │   ├── features/
│   │   ├── hooks/
│   │   ├── lib/
│   │   ├── stores/
│   │   └── types/
│   ├── Dockerfile
│   ├── .env.example
│   ├── package.json
│   ├── README.md
│   ├── tsconfig.json
│   ├── eslint.config.mjs
│   └── prettier.config.mjs
├── scripts/
│   ├── deploy/
│   ├── dev/
│   └── ssl/
├── .env.example
├── .gitignore
├── .prettierrc.json
├── CONTRIBUTING.md
├── docker-compose.yml
├── docker-compose.prod.yml
├── LICENSE
├── package.json
└── README.md
```

## Ownership rules

| Path | Owns |
|------|------|
| `frontend/` | Public UX, SEO, cart UI |
| `admin/` | Internal ops UI |
| `backend/` | Business rules & persistence API |
| `database/` | Single source of truth for schema |
| `docs/` | Specs — update when behaviour changes |
| `docker/` | Runtime packaging & reverse proxy |
| `scripts/` | Automation only — no business logic |
