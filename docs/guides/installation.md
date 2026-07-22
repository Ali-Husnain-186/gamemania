# Installation Guide

## 1. Clone

```powershell
cd D:\upwork-projects\GAME-MANIA
```

## 2. Environment

```powershell
Copy-Item .env.example .env
Copy-Item backend\.env.example backend\.env
Copy-Item frontend\.env.example frontend\.env.local
Copy-Item admin\.env.example admin\.env.local
```

Edit secrets in those files.

## 3. Start databases

```powershell
docker compose up -d postgres redis
```

## 4. Install dependencies

From repo root (npm workspaces):

```powershell
npm install
```

## 5. Database migrate & seed

```powershell
cd backend
npx prisma generate --schema ..\database\prisma\schema.prisma
npx prisma migrate dev --schema ..\database\prisma\schema.prisma --name init
npm run prisma:seed
cd ..
```

## 6. Run apps (three terminals)

```powershell
npm run dev:backend
npm run dev:frontend
npm run dev:admin
```

- Storefront: http://localhost:3000  
- Admin: http://localhost:3001  
- API health: http://localhost:4000/api/v1/health  

## 7. Default seed accounts

Documented in seed output. Typical:

| Email | Role | Password |
|-------|------|----------|
| admin@gamemania.com | SUPER_ADMIN | ChangeMe123! |
| demo@gamemania.com | CUSTOMER | ChangeMe123! |

Change immediately after first login in non-local environments.

## Troubleshooting

| Issue | Fix |
|-------|-----|
| `docker` not found | Start Docker Desktop; add CLI to PATH |
| Port in use | Stop conflicting process or change compose ports |
| Prisma P1001 | Postgres not healthy yet — wait / check `docker compose ps` |
