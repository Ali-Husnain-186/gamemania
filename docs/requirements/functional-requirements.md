# Functional Requirements

IDs use `FR-<AREA>-NNN`. Priority: Must / Should / Could.

## Authentication & users

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-AUTH-001 | Users can register with email/password | Must |
| FR-AUTH-002 | Users can login and receive JWT access + refresh | Must |
| FR-AUTH-003 | Users can refresh tokens; refresh tokens rotate | Must |
| FR-AUTH-004 | Users can login with Google | Should |
| FR-AUTH-005 | Users can reset forgotten password via email | Must |
| FR-AUTH-006 | RBAC enforces permissions on admin/API routes | Must |
| FR-AUTH-007 | Users manage profile and multiple addresses | Must |

## Catalog

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-CAT-001 | Browse products by category / brand / platform | Must |
| FR-CAT-002 | Product detail with images, price, stock, specs | Must |
| FR-CAT-003 | Search with filters and sort | Must |
| FR-CAT-004 | Admin CRUD for products, categories, brands | Must |
| FR-CAT-005 | Inventory tracking and low-stock flags | Must |

## Cart & checkout

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-ORD-001 | Add/update/remove cart lines | Must |
| FR-ORD-002 | Apply coupon / gift card / store credit / points | Must |
| FR-ORD-003 | Shipping calculated from admin rules | Must |
| FR-ORD-004 | Free shipping when subtotal ≥ configured threshold (£60 default) | Must |
| FR-ORD-005 | Checkout with Stripe or PayPal | Must |
| FR-ORD-006 | Order confirmation email + invoice | Must |
| FR-ORD-007 | Customer order history and tracking | Must |
| FR-ORD-008 | Admin can update fulfilment status and refund | Must |

## Trade-in

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-TRD-001 | Wizard: console → device → model → storage → condition → accessories | Must |
| FR-TRD-002 | Automatic quote from pricing rules | Must |
| FR-TRD-003 | Choose cash or store credit payout | Must |
| FR-TRD-004 | Submit request and track status | Must |
| FR-TRD-005 | Admin approve / adjust / reject and mark paid | Must |

## Loyalty & engagement

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-LOY-001 | Earn reward points on completed orders | Should |
| FR-LOY-002 | Redeem points at checkout | Should |
| FR-LOY-003 | Store credit balance from trade-in / admin | Must |
| FR-LOY-004 | Wishlist add/remove | Must |
| FR-LOY-005 | Product reviews with moderation | Should |

## Content

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-CMS-001 | Blog list/detail with SEO | Should |
| FR-CMS-002 | CMS pages: About, FAQ, Contact, Offers | Must |
| FR-CMS-003 | Contact form sends email via Resend | Must |
| FR-CMS-004 | Site settings editable in admin | Must |

## Notifications & admin

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-NTF-001 | In-app notifications for order/trade events | Should |
| FR-ADM-001 | Dashboard KPIs (sales, orders, trade queue) | Must |
| FR-ADM-002 | Audit log of privileged actions | Must |
| FR-ADM-003 | Reports export (CSV) | Could |
