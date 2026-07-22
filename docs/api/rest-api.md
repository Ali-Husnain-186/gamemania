# REST API Documentation

**Base URL (dev):** `http://localhost:4000/api/v1`  
**Base URL (prod):** `https://api.gamemania.com/api/v1`  
**Format:** JSON  
**Auth:** `Authorization: Bearer <access_token>` unless noted.

## Conventions

| Item | Rule |
|------|------|
| Success | `{ "success": true, "data": ..., "meta"?: ... }` |
| Error | `{ "success": false, "error": { "code": "...", "message": "...", "details"?: ... } }` |
| Money | Integer pence |
| Pagination | `?page=1&limit=20` → `meta.pagination` |
| IDs | `cuid` strings |

## Auth

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/auth/register` | Public | Email/password register |
| POST | `/auth/login` | Public | Login → access + set refresh cookie |
| POST | `/auth/refresh` | Cookie | Rotate refresh, new access |
| POST | `/auth/logout` | Auth | Revoke session |
| POST | `/auth/forgot-password` | Public | Send reset email |
| POST | `/auth/reset-password` | Public | Reset with token |
| GET | `/auth/google` | Public | Start Google OAuth |
| GET | `/auth/google/callback` | Public | OAuth callback |
| GET | `/auth/me` | Auth | Current user + permissions |

## Users & addresses

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| PATCH | `/users/me` | Auth | Update profile |
| GET | `/users/me/addresses` | Auth | List addresses |
| POST | `/users/me/addresses` | Auth | Create address |
| PATCH | `/users/me/addresses/:id` | Auth | Update |
| DELETE | `/users/me/addresses/:id` | Auth | Delete |

## Catalog (public)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/products` | List/filter/sort/search |
| GET | `/products/:slug` | Detail by slug |
| GET | `/categories` | Category tree |
| GET | `/categories/:slug` | Category + products |
| GET | `/brands` | Brands |
| GET | `/brands/:slug` | Brand detail |

Query params for `/products`: `q`, `category`, `brand`, `platform`, `condition`, `minPrice`, `maxPrice`, `sort`, `page`, `limit`.

## Cart

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/cart` | Auth/Guest | Get cart |
| POST | `/cart/items` | Auth/Guest | Add item |
| PATCH | `/cart/items/:id` | Auth/Guest | Update qty |
| DELETE | `/cart/items/:id` | Auth/Guest | Remove |
| POST | `/cart/merge` | Auth | Merge guest cart |

Guest carts use `X-Guest-Id` header.

## Checkout & orders

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/checkout/preview` | Auth | Totals + shipping quote |
| POST | `/checkout` | Auth | Create order + payment session |
| GET | `/orders` | Auth | My orders |
| GET | `/orders/:orderNumber` | Auth | Order detail |
| GET | `/orders/:orderNumber/invoice` | Auth | Invoice |

## Payments / webhooks

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/payments/stripe/webhook` | Signature | Stripe events |
| POST | `/payments/paypal/webhook` | Signature | PayPal events |
| POST | `/payments/:id/refund` | Admin | Refund |

## Shipping

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/shipping/quote` | Public | Quote for subtotal |
| GET | `/admin/shipping-rules` | Admin | List rules |
| POST | `/admin/shipping-rules` | Admin | Create |
| PATCH | `/admin/shipping-rules/:id` | Admin | Update |
| DELETE | `/admin/shipping-rules/:id` | Admin | Soft/hard deactivate |

## Wishlist / reviews / coupons

| Method | Path | Description |
|--------|------|-------------|
| GET/POST/DELETE | `/wishlist` … | Wishlist CRUD |
| GET/POST | `/products/:id/reviews` | List / create review |
| POST | `/coupons/validate` | Validate code for cart |

## Trade-in

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/trade-in/consoles` | Public | Tree for wizard |
| POST | `/trade-in/quote` | Public/Auth | Automatic quote |
| POST | `/trade-in/requests` | Auth | Submit request |
| GET | `/trade-in/requests` | Auth | My requests |
| GET | `/trade-in/requests/:id` | Auth | Detail |
| GET | `/admin/trade-in/requests` | Admin | Queue |
| PATCH | `/admin/trade-in/requests/:id` | Admin | Grade / approve / pay |
| CRUD | `/admin/trade-in/pricing` | Admin | Pricing rules |

## Loyalty

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/loyalty/points` | Auth | Balance + ledger |
| GET | `/loyalty/store-credit` | Auth | Balance + ledger |

## CMS / blog / settings

| Method | Path | Description |
|--------|------|-------------|
| GET | `/pages/:slug` | Published CMS page |
| GET | `/blog` | Published posts |
| GET | `/blog/:slug` | Post detail |
| POST | `/contact` | Contact form |
| GET | `/settings/public` | Public settings subset |

## Admin (permission-gated)

Prefix `/admin/*` for:

- Dashboard analytics
- Products / categories / brands / inventory
- Orders / customers
- Coupons / reviews moderation
- Blogs / CMS / notifications
- Users / roles / permissions
- Audit logs / reports / settings

Exact permission codes: `products:read`, `products:write`, `orders:write`, `trade:write`, `users:write`, `settings:write`, `cms:write`, `reports:read`, etc.

## OpenAPI

A machine-readable OpenAPI 3 document will be generated at `/api/v1/docs` (Swagger UI) during Phase 2 implementation.
