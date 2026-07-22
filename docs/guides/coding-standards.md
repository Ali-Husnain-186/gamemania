# Coding Standards

## TypeScript

- `strict: true` everywhere
- No `any` unless justified with comment
- Prefer `unknown` + narrowing at boundaries
- Shared API types mirrored via Zod schemas in backend validators

## Backend

- Controllers: HTTP only — no business rules
- Services: domain logic and transactions
- Repositories: Prisma access only
- Throw typed exceptions (`AppError`); central error middleware formats responses
- Validate with Zod in middleware before controller

## Frontend / Admin

- Server Components default; `"use client"` only when needed
- Feature folders: `features/<name>/{components,hooks,api}`
- Forms: React Hook Form + Zod
- Server state: TanStack Query
- Client UI state: Zustand
- Accessible labels, keyboard navigation, focus states

## Naming

| Kind | Style |
|------|-------|
| Files (components) | `PascalCase.tsx` |
| Files (utils) | `camelCase.ts` |
| React components | PascalCase |
| Functions / vars | camelCase |
| DB / Prisma models | PascalCase model, snake map tables |
| Env vars | SCREAMING_SNAKE |

## Git

Conventional Commits. No secrets. Small focused PRs.

## Formatting

Prettier + ESLint. Husky + lint-staged on pre-commit.

## Money

Always integer pence in API and DB. Format for display in UI helpers (`formatGbp`).
