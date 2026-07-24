## Workflow phases (charter)

| Phase | Focus                                       | Status                       |
| ----- | ------------------------------------------- | ---------------------------- |
| 1     | Analyze project                             | Complete                     |
| 2     | Folder structure (Windows-first, no Docker) | Complete                     |
| 3     | System architecture design                  | Complete                     |
| 4     | Database design                             | Complete                     |
| 5     | Prisma schema                               | Complete                     |
| 6     | REST API design                             | Complete (MVP)               |
| 7     | Documentation suite polish                  | In progress                  |
| 8     | Git hygiene                                 | Ongoing                      |
| 9–11  | Configure backend / frontend / admin        | Complete (local)             |
| 12–15 | UI, modules, admin, integration             | Complete (MVP)               |
| 16–18 | Testing, performance, production            | Smoke + local hardening done |

## Product delivery roadmap (implementation)

**Defaults:** UK market, GBP, en-GB. Free shipping at £60+ (admin-configurable). Local PostgreSQL only for MVP (no paid cloud DB).

### Auth & platform core

- [x] JWT + refresh sessions
- [x] RBAC (roles/permissions seed)
- [ ] Google OAuth
- [x] User profile & addresses
- [x] Audit logging on admin writes
- [x] Rate limiting (global + auth) & security headers

### Catalog & inventory

- [x] Categories, brands, products, image URLs
- [x] Inventory stock (Cloudinary optional later)
- [x] Search, filters, sort APIs
- [x] Storefront: Home, Shop, Product, Cart, Checkout
- [x] Admin: Products CRUD

### Cart, checkout, orders

- [x] Cart (guest + authenticated)
- [x] Coupons application at checkout preview
- [x] Shipping rule engine (£60 threshold)
- [x] Checkout + order creation (`AWAITING_PAYMENT` without Stripe keys)
- [x] Stripe Checkout Session when `STRIPE_SECRET_KEY` set (PayPal stub later)
- [x] Customer order list; admin order status updates
- [ ] Full webhook + refund automation

### Loyalty & engagement

- [x] Reward points redeem at checkout (basic)
- [x] Store credit ledger (trade-in payout + checkout)
- [x] Wishlist
- [x] Reviews APIs + admin moderation routes
- [x] In-app notifications on order/trade events

### Trade-in

- [x] Seeded pricing tree
- [x] Public quote wizard + request submit
- [x] Admin grading / approve / pay → store credit

### CMS & content

- [x] CMS pages (About, FAQ, Contact) public + admin CRUD
- [x] Blog admin/public routes
- [x] Site settings admin
- [ ] SEO sitemap / robots polish

### Analytics, polish, production

- [x] Admin dashboard aggregates
- [x] Local smoke script (`scripts/dev/smoke-mvp.ps1`)
- [ ] Reports export
- [ ] Production deploy on Hostinger Ubuntu VPS
- [ ] Cloudflare, GA, monitoring

## Local demo

- Customer: `demo@gamemania.com` / `ChangeMe123!`
- Admin: `Info@gamemaniauk.co.uk` / `Private08!` → `/admin` only
- Ports: storefront+admin `:3000`, API `:5000`
