# ER Diagram (logical)

Full Prisma field-level detail: [`database/prisma/schema.prisma`](../../database/prisma/schema.prisma).

## High-level relationships

```mermaid
flowchart TB
  subgraph identity [Identity]
    User --> Role
    Role --> Permission
    User --> Session
  end

  subgraph catalog [Catalog]
    Category --> Product
    Brand --> Product
    Product --> ProductImage
    Product --> Inventory
  end

  subgraph commerce [Commerce]
    User --> Cart
    Cart --> CartItem
    CartItem --> Product
    User --> Order
    Order --> OrderItem
    Order --> Payment
    Payment --> Refund
    Order --> Invoice
    ShippingRule --> Order
    Coupon --> Order
  end

  subgraph tradein [TradeIn]
    TradeConsole --> TradeDevice
    TradeDevice --> TradeModel
    TradeModel --> TradeModelOption
    TradeModelOption --> TradeRequest
    User --> TradeRequest
  end

  subgraph loyalty [Loyalty]
    User --> RewardPointLedger
    User --> StoreCreditLedger
    User --> WishlistItem
  end

  subgraph content [Content]
    User --> BlogPost
    CmsPage
    Setting
    Notification
    AuditLog
  end
```

## Cardinality notes

| Relationship | Cardinality |
|--------------|-------------|
| User : Role | N : 1 |
| Product : Inventory | 1 : 1 |
| Order : Payment | 1 : N |
| User : TradeRequest | 1 : N |
| TradeModelOption : TradeRequest | 1 : N |
| Product : Review | 1 : N (unique per user) |
