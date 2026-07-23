# GAME-MANIA — finish local DB setup (Windows)
# 1) In pgAdmin as postgres user, run scripts/dev/grant-db-perms.sql on database gamemania
# 2) Then run this script from repo root:
#    powershell -ExecutionPolicy Bypass -File scripts/dev/setup-db.ps1

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'
$Root = Split-Path (Split-Path $PSScriptRoot -Parent) -Parent
Set-Location $Root

Write-Host "Pushing Prisma schema..."
Set-Location backend
npx prisma db push --schema ../database/prisma/schema.prisma
if ($LASTEXITCODE -ne 0) {
  Write-Host "db push failed. Did you run grant-db-perms.sql as postgres?" -ForegroundColor Red
  exit 1
}

Write-Host "Seeding..."
npm run prisma:seed
if ($LASTEXITCODE -ne 0) { exit 1 }

Write-Host ""
Write-Host "Database ready." -ForegroundColor Green
Write-Host "Demo logins (password ChangeMe123!):"
Write-Host "  admin@gamemania.com  (admin)"
Write-Host "  demo@gamemania.com   (customer)"
Write-Host ""
Write-Host "Apps: frontend :3000 | admin :3001 | api :5000"
