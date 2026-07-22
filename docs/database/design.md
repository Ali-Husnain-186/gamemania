# Database Design

**Engine:** PostgreSQL 16  
**ORM:** Prisma  
**Schema path:** [`database/prisma/schema.prisma`](../../database/prisma/schema.prisma)  
**Money:** integer **pence** (GBP). Never use floating point for currency.

## Design principles

1. Single database shared by the API only.
2. Soft delete (`deletedAt`) on users and products.
3. Ledger tables for reward points and store credit (immutable append-only history).
4. Order line items snapshot SKU/name/price at purchase time.
5. Shipping rules are data-driven (not hard-coded), seeded with £60 free threshold.
6. Trade-in pricing is rule-based (`TradeModelOption` + accessory deltas).

## Entity groups

| Group | Models |
|-------|--------|
| Identity | User, Role, Permission, RolePermission, Session |
| Catalog | Category, Brand, Product, ProductImage, Inventory |
| Commerce | Cart, CartItem, Order, OrderItem, Payment, Refund, Invoice, ShippingRule |
| Promotions | Coupon, CouponRedemption, GiftCard |
| Social | Review, WishlistItem, Address |
| Trade-in | TradeConsole, TradeDevice, TradeModel, TradeModelOption, TradeAccessoryRule, TradeRequest |
| Loyalty | RewardPointLedger, StoreCreditLedger (+ denormalized balances on User) |
| Content | CmsPage, BlogPost, Setting, Notification, AuditLog |

## Shipping rule algorithm

Given order merchandise subtotal `S` (pence) and country `C`:

1. Select active rules where `country = C` and `minOrderAmount <= S` and (`maxOrderAmount` is null or `S <= maxOrderAmount`).
2. Pick highest `priority`; on tie, prefer lower `rate`.
3. Apply `rate` as `shippingTotal`.

**Seed defaults:**

| Rule | min | max | rate |
|------|-----|-----|------|
| Standard under £60 | 0 | 5999 | 395 (£3.95) |
| Free £60+ | 6000 | null | 0 |

Editable in Admin → Shipping Rules / Settings.

## ER diagram

```mermaid
erDiagram
  User ||--o| Role : has
  Role ||--o{ RolePermission : grants
  Permission ||--o{ RolePermission : granted_by
  User ||--o{ Session : has
  User ||--o{ Address : has
  User ||--o| Cart : has
  Cart ||--o{ CartItem : contains
  Product ||--o{ CartItem : in
  Category ||--o{ Product : contains
  Brand ||--o{ Product : brands
  Product ||--o| Inventory : stocks
  Product ||--o{ ProductImage : has
  User ||--o{ Order : places
  Order ||--o{ OrderItem : contains
  Order ||--o{ Payment : paid_by
  Payment ||--o{ Refund : may_have
  Order ||--o| Invoice : has
  ShippingRule ||--o{ Order : applies
  Coupon ||--o{ Order : applied
  Product ||--o{ Review : receives
  User ||--o{ Review : writes
  User ||--o{ TradeRequest : submits
  TradeConsole ||--o{ TradeDevice : has
  TradeDevice ||--o{ TradeModel : has
  TradeModel ||--o{ TradeModelOption : priced_as
  TradeModelOption ||--o{ TradeRequest : quoted
  User ||--o{ RewardPointLedger : tracks
  User ||--o{ StoreCreditLedger : tracks
  User ||--o{ Notification : receives
  User ||--o{ AuditLog : performs
```

See also [er-diagram.md](./er-diagram.md).

## Indexing strategy

- Unique: email, slug, sku, orderNumber, coupon code, gift card code
- Composite: wishlist (userId, productId), review (productId, userId)
- Query: order status + createdAt, product status + platform + price

## Migrations

```powershell
cd backend
npm run prisma:migrate
npm run prisma:seed
```

Schema lives in `database/prisma` so all apps reference one source of truth.
