# GAME-MANIA — Project Roadmap

**Defaults:** UK market, GBP, en-GB. Free shipping at £60+ (admin-configurable).

## Phase 0 — Analysis (complete)

- [x] Confirm empty workspace
- [x] Choose market defaults (UK / GBP)
- [x] Define system context and app boundaries

## Phase 1 — Foundation (complete)

- [x] Monorepo folder structure
- [x] Root Git, LICENSE, CONTRIBUTING, .gitignore, .env.example
- [x] Professional documentation suite under `docs/`
- [x] Prisma schema for all core entities
- [x] Windows-first local setup (native PostgreSQL — no Docker)
- [x] Nginx + PM2 + SSL deploy templates (`deploy/`)
- [x] Backend Clean Architecture scaffold
- [x] Frontend & Admin Next.js scaffolds (no full page builds yet)
- [x] GitHub Actions CI skeleton + issue/PR templates
- [x] Architecture review checkpoint

## Phase 2 — Auth & platform core

- [ ] JWT + refresh sessions
- [ ] RBAC (roles/permissions seed)
- [ ] Google OAuth
- [ ] User profile & addresses
- [ ] Audit logging middleware
- [ ] Rate limiting & security headers

## Phase 3 — Catalog & inventory

- [ ] Categories, brands, products, images (Cloudinary)
- [ ] Inventory stock & low-stock alerts
- [ ] Search, filters, sort APIs
- [ ] Storefront: Home, Shop, Category, Product, Search (SSR/ISR)
- [ ] Admin: Products, Categories, Brands, Inventory

## Phase 4 — Cart, checkout, orders

- [ ] Cart (guest + authenticated)
- [ ] Coupons / gift cards application
- [ ] Shipping rule engine (£60 threshold)
- [ ] Checkout + order creation
- [ ] Stripe + PayPal + webhooks
- [ ] Order tracking, invoices, refunds
- [ ] Admin order management

## Phase 5 — Loyalty & engagement

- [ ] Reward points earn/redeem
- [ ] Store credit ledger
- [ ] Wishlist
- [ ] Reviews + moderation
- [ ] Notifications (in-app + Resend email)

## Phase 6 — Trade-in

- [ ] Pricing rules admin
- [ ] Public quote wizard
- [ ] Request submission & status tracking
- [ ] Admin grading / approval / payout
- [ ] Restock path for approved pre-owned (optional inventory link)

## Phase 7 — CMS & content

- [ ] Blog (ISR)
- [ ] CMS pages (About, FAQ, Contact)
- [ ] Offers landing
- [ ] Site settings
- [ ] SEO (metadata, sitemap, robots, Search Console)

## Phase 8 — Analytics, polish, production

- [ ] Admin dashboard analytics
- [ ] Reports export
- [ ] Performance (caching, image opt, compression)
- [ ] Accessibility pass
- [ ] Dark / light theme polish
- [ ] Production deploy on Hostinger Ubuntu VPS
- [ ] Cloudflare, GA, monitoring
- [ ] Load / smoke tests

## Milestone checkpoints

| Milestone | Exit criteria |
|-----------|---------------|
| M1 Foundation | Native Postgres + docs complete; scaffolds build on Windows |
| M2 Auth | Register/login/refresh/RBAC/Google work via API |
| M3 Catalog | Browse & admin CRUD for products live |
| M4 Commerce | End-to-end paid order with Stripe sandbox |
| M5 Loyalty | Points + credit applied at checkout |
| M6 Trade-in | Quote → submit → admin approve → credit |
| M7 Content | Blog + static CMS pages SEO-ready |
| M8 Launch | TLS live on all three hostnames |

## Explicit sequencing rule

Do **not** build customer-facing pages before M1–M2 APIs and design tokens/components exist. Follow workflow steps 1–10 before page implementation (step 11+).
