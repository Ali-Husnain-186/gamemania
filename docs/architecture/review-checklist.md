# Architecture review checklist — Phase 1 exit

## Confirmed decisions

- [x] UK market, GBP (pence), en-GB
- [x] Three apps: frontend / admin / backend
- [x] Clean Architecture on API
- [x] Shipping rules data-driven (£60 free default)
- [x] Trade-in as bounded context with pricing rules
- [x] Docker Compose for local Postgres/Redis and production stack
- [x] Docs suite under docs/

## Ready for Phase 2 when

- [ ] `docker compose up -d postgres redis` healthy
- [ ] `npm install` at root succeeds
- [ ] Prisma migrate + seed succeeds
- [ ] `GET /api/v1/health` returns ok
- [ ] Frontend and admin `npm run dev` serve foundation pages

## Deferred (by design)

- Full storefront page set
- Auth implementation details beyond types/docs
- Payment provider live keys
- shadcn component generation (Phase 11 / Phase 3 UI)
