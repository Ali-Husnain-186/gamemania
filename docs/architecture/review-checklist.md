# Architecture review checklist — Phase 2 exit (folder structure)

## Confirmed decisions

- [x] UK market, GBP (pence), en-GB
- [x] Three apps: frontend / admin / backend
- [x] Clean Architecture on API
- [x] Shipping rules data-driven (£60 free default)
- [x] Trade-in as bounded context with pricing rules
- [x] **No Docker** — native PostgreSQL locally; PM2 + Nginx in production
- [x] API port **5000** (frontend 3000, admin 3001)
- [x] Complete feature-based folder structure with module placeholders
- [x] GitHub issue + PR templates
- [x] Docs suite under docs/

## Ready for Phase 3 (system architecture design) when

- [x] Folder structure committed and documented
- [ ] Architecture diagrams / ADRs refined in Phase 3
- [ ] Prisma schema review in Phases 4–5
- [ ] REST contract freeze in Phase 6

## Deferred (by design)

- Full storefront page set
- Auth implementation
- Payment provider live keys
- shadcn component generation
