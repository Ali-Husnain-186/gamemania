# Contributing to GAME-MANIA

Thank you for contributing. This document describes how we work in this monorepo.

## Prerequisites

- Windows 11 or Linux (Ubuntu) with Node.js LTS, npm, Docker Desktop / Docker Engine, Git
- Read [docs/guides/coding-standards.md](docs/guides/coding-standards.md)

## Branching

| Branch | Purpose |
|--------|---------|
| `main` | Production-ready |
| `develop` | Integration |
| `feature/*` | New features |
| `fix/*` | Bug fixes |
| `chore/*` | Tooling / docs |

## Commit messages

Use Conventional Commits:

```
feat(backend): add trade-in quote endpoint
fix(frontend): correct cart shipping threshold
docs: update deployment guide for Hostinger
chore(docker): pin postgres to 16-alpine
```

Types: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `chore`, `ci`.

## Pull requests

1. Branch from `develop`.
2. Keep PRs focused and small.
3. Ensure lint and typecheck pass.
4. Update docs when behaviour or APIs change.
5. Request review before merge.

## Code standards

- TypeScript strict mode in all apps
- Clean Architecture on the backend (controllers → services → repositories)
- Feature-based folders on frontend/admin
- No secrets in Git — use `.env.example` only
- Prefer Zod for validation at API and form boundaries

## Local checks

```powershell
cd backend; npm run lint; npm run typecheck
cd frontend; npm run lint; npm run typecheck
cd admin; npm run lint; npm run typecheck
```

## Security

Never commit API keys, JWT secrets, or database passwords. Report vulnerabilities privately to the maintainers.
