# GAME-MANIA Backend API

Express.js + TypeScript + Prisma Clean Architecture REST API.

**Dev URL:** http://localhost:5000  
**Health:** `GET /api/v1/health`

## Scripts

| Command                   | Description                       |
| ------------------------- | --------------------------------- |
| `npm run dev`             | Start API with hot reload (:5000) |
| `npm run build`           | Compile to `dist/`                |
| `npm start`               | Run compiled server               |
| `npm run prisma:generate` | Generate Prisma client            |
| `npm run prisma:migrate`  | Dev migrations                    |
| `npm run prisma:seed`     | Seed roles, shipping, demo data   |

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

## Stripe checkout (required for paid orders)

Paid checkout uses **Stripe Checkout** (hosted card page). Card details never touch this API.

1. Create a Stripe account and copy a **test** secret key (`sk_test_...`) into `backend/.env` as `STRIPE_SECRET_KEY`.
2. Install [Stripe CLI](https://stripe.com/docs/stripe-cli), then forward webhooks:

```bash
stripe listen --forward-to localhost:5000/api/v1/payments/stripe/webhook
```

3. Put the CLI `whsec_...` value into `STRIPE_WEBHOOK_SECRET` and **restart** the API.
4. Place a test order → you should redirect to Stripe → pay with `4242 4242 4242 4242` → return to `/checkout?paid=1&order=...` with a verified confirmation.

Without `STRIPE_SECRET_KEY`, checkout returns a clear error and does **not** create a confirmed unpaid order.
