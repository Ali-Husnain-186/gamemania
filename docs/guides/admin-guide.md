# Admin Guide

## Access

Production: `https://YOUR_DOMAIN/admin`  
Local: http://localhost:3000/admin

Requires staff role (`STAFF`, `ADMIN`, or `SUPER_ADMIN`). Seed: `Info@gamemaniauk.co.uk` / `Private08!`.

Staff accounts only see the admin panel — visiting the storefront redirects them to `/admin`.

## Modules

| Module                      | Purpose                           |
| --------------------------- | --------------------------------- |
| Dashboard                   | Sales, orders, trade queue KPIs   |
| Products                    | CRUD, images, SEO fields          |
| Categories / Brands         | Taxonomy                          |
| Inventory                   | Stock adjustments, low-stock      |
| Orders                      | Status, refunds, invoices         |
| Customers                   | Profiles, credit/points adjust    |
| Trade Requests              | Grade, approve, payout            |
| Trade Pricing               | Console/device/model/option rules |
| Coupons                     | Discount codes                    |
| Reviews                     | Moderate                          |
| Blogs / CMS                 | Content publishing                |
| Users / Roles / Permissions | RBAC                              |
| Shipping Rules              | Edit £60 free threshold & rates   |
| Notifications               | Broadcast / templates             |
| Logs                        | Audit trail                       |
| Settings                    | Store name, email, loyalty rates  |
| Reports                     | Exports                           |

## Shipping rules

Default seed:

1. Orders under £60 → charge £3.95
2. Orders £60+ → free

Change rates/thresholds under **Shipping Rules** — no deploy required.

## Trade-in workflow

1. Customer submits request (status `SUBMITTED`)
2. Mark `RECEIVED` when parcel arrives
3. Grade condition; adjust amount if needed
4. `APPROVED` / `REJECTED`
5. `PAID` — credit applied to ledger or cash marked paid

## Security

- Least-privilege roles
- All destructive actions audited
- Never share admin credentials
