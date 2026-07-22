# Software Requirements Specification (SRS)

**Product:** GAME-MANIA  
**Type:** UK Gaming Marketplace (B2C ecommerce + trade-in)  
**Version:** 1.0.0  
**Locale / Currency:** en-GB / GBP

## 1. Purpose

GAME-MANIA enables customers to purchase new and pre-owned gaming products online, trade in devices for cash or store credit, earn loyalty rewards, and manage orders through a self-service account. Staff operate catalog, fulfilment, trade-in, CMS, and reporting via a dedicated admin application.

Inspiration only: Gamerium, The Game Collection. UI and code must be original.

## 2. Stakeholders

| Role | Needs |
|------|-------|
| Customer | Browse, buy, trade-in, track orders, rewards |
| Guest | Browse catalog, use cart (merge on login) |
| Admin / Staff | Manage catalog, orders, trade-ins, content |
| Super Admin | Roles, permissions, settings, audit |
| System | Payments webhooks, email, image CDN |

## 3. Scope

### In scope

- Product catalog with search/filter/sort
- Cart, checkout, Stripe & PayPal
- Configurable shipping (free ≥ £60 default)
- Wishlist, reviews, coupons, gift cards
- Reward points & store credit
- Trade-in quote → approval → payout
- Blog / CMS / FAQ / contact
- Admin dashboard with RBAC
- Dockerized deploy to Ubuntu VPS

### Out of scope (v1)

- Multi-vendor marketplace
- Native mobile apps
- Live chat widget (may add later)
- Click & collect

## 4. Functional overview

See [functional-requirements.md](./functional-requirements.md).

## 5. Non-functional overview

See [non-functional-requirements.md](./non-functional-requirements.md).

## 6. System interfaces

- REST JSON API `/api/v1`
- Stripe & PayPal webhooks
- Cloudinary upload API
- Resend transactional email
- Google OAuth 2.0
- Google Analytics / Search Console (frontend)

## 7. Assumptions

- Single merchant legal entity (UK)
- Docker Desktop available for local Postgres
- Domain DNS pointed to VPS for production SSL

## 8. Constraints

- Must run on Windows 11 for development
- Production target: Linux Ubuntu (Hostinger)
- Stack fixed per project charter (Next 15, Express, Prisma, Postgres)
