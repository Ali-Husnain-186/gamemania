# GAME-MANIA — Integration Architecture

## Payment orchestration

```mermaid
sequenceDiagram
  participant FE as Frontend
  participant API as Backend
  participant PSP as Stripe/PayPal
  participant DB as PostgreSQL

  FE->>API: POST /checkout
  API->>DB: Create Order + Payment PENDING
  API->>PSP: Create payment session
  API-->>FE: client secret / approve URL
  FE->>PSP: Customer pays
  PSP->>API: Webhook paid
  API->>DB: Mark Paid, adjust inventory, ledger
  API-->>FE: Order status via poll/redirect
```

### Idempotency

- Store provider event IDs
- Ignore duplicate webhooks safely
- Never decrement stock twice

## Media (Cloudinary)

- Preferred: admin uploads file to `POST /api/v1/admin/uploads/image` (multipart); API streams to Cloudinary and returns `{ url, publicId }`.
- Fallback: signed upload params from `POST /api/v1/admin/uploads/sign`, then browser → Cloudinary.
- API persists `ProductImage` metadata on product create/update.
- Requires `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` on the backend.

## Email (Resend)

Transactional only in v1: welcome, reset password, order confirmation, shipping update, trade-in status.

## Analytics

- GA4 measurement ID on storefront only
- No PII in event payloads beyond allowed ecommerce fields
