# GAME-MANIA Backend API

Express.js + TypeScript + Prisma Clean Architecture REST API.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start API with hot reload |
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
  types/
  exceptions/
  utils/
  logs/
  app.ts
  server.ts
```

## Health

`GET /api/v1/health`

See [docs/api/rest-api.md](../docs/api/rest-api.md).
