# Environment Setup

## Windows 11 checklist

1. Node.js LTS (≥ 20) — verified via `node -v`
2. npm (≥ 10)
3. Git
4. Docker Desktop with WSL2 backend enabled
5. Cursor / VS Code

Ensure Docker Desktop is running before `docker compose` commands. If `docker` is not in PATH, start Docker Desktop and reopen the terminal.

## Environment files

| File | Purpose |
|------|---------|
| `.env` | Root / compose shared vars |
| `backend/.env` | API secrets |
| `frontend/.env.local` | Storefront public + API URL |
| `admin/.env.local` | Admin public + API URL |

Copy from each `.env.example`.

## Required secrets for local MVP

Minimum to boot API + DB:

- `DATABASE_URL`
- `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` (≥ 32 chars)

Optional until feature work:

- Stripe / PayPal / Google / Cloudinary / Resend keys

## Ports

| Service | Port |
|---------|------|
| Frontend | 3000 |
| Admin | 3001 |
| API | 4000 |
| Postgres | 5432 |
| Redis | 6379 |
| Nginx (prod compose) | 80 / 443 |

## IDE

Recommended VS Code extensions: ESLint, Prettier, Prisma, Tailwind CSS IntelliSense, Docker.
