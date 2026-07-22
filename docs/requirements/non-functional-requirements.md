# Non-Functional Requirements

## Performance

| ID | Requirement |
|----|-------------|
| NFR-PERF-001 | p95 API latency < 300ms for catalog reads under normal load |
| NFR-PERF-002 | LCP of key storefront pages < 2.5s on broadband |
| NFR-PERF-003 | Images via Cloudinary with responsive sizes |
| NFR-PERF-004 | Next.js code splitting; Server Components by default |
| NFR-PERF-005 | DB indexes on foreign keys, slugs, SKU, order numbers |

## Scalability

| ID | Requirement |
|----|-------------|
| NFR-SCALE-001 | Stateless API instances behind Nginx |
| NFR-SCALE-002 | Horizontal scale of frontend/admin containers |
| NFR-SCALE-003 | Connection pooling via Prisma |

## Security

| ID | Requirement |
|----|-------------|
| NFR-SEC-001 | Passwords hashed with bcrypt (cost ≥ 12) |
| NFR-SEC-002 | JWT access short-lived; refresh rotation |
| NFR-SEC-003 | Helmet, CORS allowlist, rate limits |
| NFR-SEC-004 | Zod validation on all mutating endpoints |
| NFR-SEC-005 | Secrets only via environment variables |
| NFR-SEC-006 | Webhook signature verification |
| NFR-SEC-007 | RBAC on all admin mutations |
| NFR-SEC-008 | XSS mitigated via React escaping + CSP headers |
| NFR-SEC-009 | CSRF protections on cookie-auth routes |

## Reliability

| ID | Requirement |
|----|-------------|
| NFR-REL-001 | Payment webhooks idempotent |
| NFR-REL-002 | Structured logging with request IDs |
| NFR-REL-003 | Graceful shutdown of API process |
| NFR-REL-004 | DB migrations versioned and reversible where practical |

## Usability & accessibility

| ID | Requirement |
|----|-------------|
| NFR-UX-001 | Responsive: mobile, tablet, desktop |
| NFR-UX-002 | Light and dark themes |
| NFR-UX-003 | WCAG 2.1 AA target for core flows |
| NFR-UX-004 | Loading skeletons on async views |

## SEO

| ID | Requirement |
|----|-------------|
| NFR-SEO-001 | SSR/ISR for catalog and blog |
| NFR-SEO-002 | Unique titles/descriptions/canonicals |
| NFR-SEO-003 | XML sitemap and robots.txt |
| NFR-SEO-004 | Structured data for products where applicable |

## Operability

| ID | Requirement |
|----|-------------|
| NFR-OPS-001 | `docker compose up -d` starts production stack |
| NFR-OPS-002 | Works on Windows 11 (Docker Desktop) for local services |
| NFR-OPS-003 | Deployable to Ubuntu VPS with Let's Encrypt |
| NFR-OPS-004 | CI lint + typecheck on PRs |

## Compliance notes

- Prices displayed inclusive of VAT as configured in settings
- Retain order and payment records for accounting
- Privacy policy / cookie notice pages via CMS
