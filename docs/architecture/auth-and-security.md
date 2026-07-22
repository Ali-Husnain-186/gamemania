# GAME-MANIA — Auth & Security Flows

Companion to [system-design.md](./system-design.md).

## Roles (seed)

| Role | Intent |
|------|--------|
| `CUSTOMER` | Storefront account |
| `STAFF` | Limited admin ops |
| `ADMIN` | Full commerce ops |
| `SUPER_ADMIN` | Roles, permissions, settings, audit |

## Endpoint groups

| Group | Auth |
|-------|------|
| Public catalog, shipping quote, trade-in quote tree | None |
| Cart guest | `X-Guest-Id` |
| Customer account | Bearer access JWT |
| Admin ` /admin/*` | Bearer + permission codes |
| Webhooks | Provider signature only |

## Password policy (v1)

- Minimum 8 characters
- Checked with Zod on register/reset
- Hashed with bcrypt before persistence

## Token lifetimes (defaults)

| Token | TTL | Storage |
|-------|-----|---------|
| Access JWT | 15m | Memory / Authorization header |
| Refresh | 7d | httpOnly cookie + hashed `Session` row |
| Password reset | 1h | DB or signed token (single use) |

## Google Login

1. `GET /auth/google` → Google consent  
2. Callback `GET /auth/google/callback`  
3. Upsert user by email/`googleId`  
4. Issue same session pair as password login  
5. Redirect to frontend with success handling (cookie already set on API domain in prod via shared parent domain strategy, or token handoff page in local)

Local note: API on `localhost:5000`, FE on `localhost:3000` — use explicit postMessage/redirect handoff for first-party cookie limits during development.
