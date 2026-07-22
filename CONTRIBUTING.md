# Contributing to GAME-MANIA

## Prerequisites

- Windows 11 or Linux (Ubuntu) with Node.js LTS, npm, native PostgreSQL, Git
- **No Docker required**

## Workflow

1. Create a feature branch from `master`
2. Keep changes scoped to one concern
3. Run lint/typecheck before opening a PR
4. Use the PR template

## Local apps

| App | Port |
|-----|------|
| frontend | 3000 |
| admin | 3001 |
| backend | 5000 |

```powershell
cd backend; npm run dev
cd frontend; npm run dev
cd admin; npm run dev
```

## Commit messages

Use Conventional Commits style:

```
feat(auth): add refresh token rotation
fix(cart): correct VAT on shipping
docs(api): document trade-in quote endpoint
chore(repo): align folder structure for Windows-first DX
```

## Pull requests

- Link related issues
- Include a short test plan
- Do not commit secrets or local `.env` files
