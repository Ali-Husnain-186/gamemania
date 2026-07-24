# GAME-MANIA — Installation Guide (Windows 11)

**No Docker required.** Use a local PostgreSQL install and npm workspaces.

## Prerequisites

- Node.js LTS (≥ 20) and npm (≥ 10)
- PostgreSQL 16+ (Windows installer)
- Git
- Optional: Redis for cache / rate-limit store

## 1. Clone and env files

```powershell
cd D:\upwork-projects\GAME-MANIA
Copy-Item .env.example .env
Copy-Item backend\.env.example backend\.env
Copy-Item frontend\.env.example frontend\.env.local
# Optional (legacy standalone admin only):
# Copy-Item admin\.env.example admin\.env.local
```

## 2. Create database

In `psql` (or pgAdmin):

```sql
CREATE USER gamemania WITH PASSWORD 'gamemania_dev_change_me';
CREATE DATABASE gamemania OWNER gamemania;
```

Align credentials with `DATABASE_URL` in `.env` / `backend/.env`.

Verify:

```powershell
npm run db:check
```

## 3. Install and migrate

```powershell
npm install
cd backend
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed
cd ..
```

## 4. Run apps (two terminals — single site)

```powershell
cd backend; npm run dev      # http://localhost:5000
cd frontend; npm run dev     # http://localhost:3000 (store + /admin)
```

Health check: http://localhost:5000/api/v1/health  
Staff UI: http://localhost:3000/admin (`Info@gamemaniauk.co.uk` / `Private08!`)

## Troubleshooting

| Issue            | Fix                                           |
| ---------------- | --------------------------------------------- |
| `psql` not found | Add PostgreSQL `bin` to PATH; reopen terminal |
| Prisma P1001     | Postgres not running or wrong `DATABASE_URL`  |
| Port in use      | Stop the process on 3000 / 5000               |

See also: [environment-setup.md](./environment-setup.md), [deployment.md](./deployment.md).
