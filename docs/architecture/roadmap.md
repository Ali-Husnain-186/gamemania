## Workflow phases (charter)

| Phase | Focus | Status |
|-------|--------|--------|
| 1 | Analyze project | Complete |
| 2 | Folder structure (Windows-first, no Docker) | Complete |
| 3 | System architecture design | Complete |
| 4 | Database design | Next |
| 5 | Prisma schema | Pending |
| 6 | REST API design | Pending |
| 7 | Documentation suite polish | Pending |
| 8 | Git hygiene | Pending |
| 9–11 | Configure backend / frontend / admin | Pending |
| 12–15 | UI, modules, admin, integration | Pending |
| 16–18 | Testing, performance, production | Pending |

## Product delivery roadmap (implementation)

**Defaults:** UK market, GBP, en-GB. Free shipping at £60+ (admin-configurable).

### Auth & platform core

- [ ] JWT + refresh sessions
- [ ] RBAC (roles/permissions seed)
- [ ] Google OAuth
- [ ] User profile & addresses
- [ ] Audit logging middleware
- [ ] Rate limiting & security headers

### Catalog & inventory

- [ ] Categories, brands, products, images (Cloudinary)
- [ ] Inventory stock & low-stock alerts
- [ ] Search, filters, sort APIs
- [ ] Storefront: Home, Shop, Category, Product, Search (SSR/ISR)
- [ ] Admin: Products, Categories, Brands, Inventory

### Cart, checkout, orders

- [ ] Cart (guest + authenticated)
- [ ] Coupons / gift cards application
- [ ] Shipping rule engine (£60 threshold)
- [ ] Checkout + order creation
- [ ] Stripe + PayPal + webhooks
- [ ] Order tracking, invoices, refunds
- [ ] Admin order management

### Loyalty & engagement

- [ ] Reward points earn/redeem
- [ ] Store credit ledger
- [ ] Wishlist
- [ ] Reviews + moderation
- [ ] Notifications (in-app + Resend email)

### Trade-in

- [ ] Pricing rules admin
- [ ] Public quote wizard
- [ ] Request submission & status tracking
- [ ] Admin grading / approval / payout
- [ ] Restock path for approved pre-owned (optional inventory link)

### CMS & content

- [ ] Blog (ISR)
- [ ] CMS pages (About, FAQ, Contact)
- [ ] Offers landing
- [ ] Site settings
- [ ] SEO (metadata, sitemap, robots, Search Console)

### Analytics, polish, production

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

Do **not** skip charter phases. Build features against [system-design.md](./system-design.md).