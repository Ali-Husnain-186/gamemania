# GAME-MANIA Backend API

Express.js + TypeScript + Prisma Clean Architecture REST API.

**Dev URL:** http://localhost:5000  
**Health:** `GET /api/v1/health`

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start API with hot reload (:5000) |
| `npm run build` | Compile to `dist/` |
| `npm start` | Run compiled server |
| `npm run prisma:generate` | Generate Prisma client |
| `npm run prisma:migrate` | Dev migrations |
| `npm run prisma:seed` | Seed roles, shipping, demo data |

## Structure

```
src/
  config/         # env, constants
  controllers/    # HTTP adapters
  services/       # business logic
  repositories/   # Prisma data access
  middlewares/    # auth, validate, errors
  routes/         # route registration
  validators/     # Zod schemas
  dto/            # response mappers
  modules/        # feature modules
  types/
  exceptions/
  utils/
  logs/
  app.ts
  server.ts
```

Requires local PostgreSQL (see root `.env.example`). See [docs/api/rest-api.md](../docs/api/rest-api.md).
