# GAME-MANIA — Environment Setup

## Tooling (Windows 11)

1. Node.js LTS from https://nodejs.org/
2. PostgreSQL from https://www.postgresql.org/download/windows/
3. Git for Windows
4. Optional: Redis (Memurai or Windows port) — not required for initial scaffold
5. Cursor / VS Code

**Docker is not used** for local development or production.

## Ports

| Service | Port |
|---------|------|
| Storefront | 3000 |
| Admin | 3001 |
| API | 5000 |
| PostgreSQL | 5432 |

## Environment files

| File | Purpose |
|------|---------|
| `.env` | Shared root template values |
| `backend/.env` | API secrets + `DATABASE_URL` |
| `frontend/.env.local` | `NEXT_PUBLIC_*` |
| `admin/.env.local` | `NEXT_PUBLIC_*` |

Never commit real `.env` files. Use `.env.example` as the source of truth for variable names.

## Recommended VS Code extensions

ESLint, Prettier, Prisma, Tailwind CSS IntelliSense, PostgreSQL client.
