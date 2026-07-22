# Verify local PostgreSQL is reachable for GAME-MANIA (Windows — no Docker).
# Install PostgreSQL from https://www.postgresql.org/download/windows/
# Create role/db matching .env.example, then run this script.

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$Root = Split-Path (Split-Path $PSScriptRoot -Parent) -Parent
Set-Location $Root

$envFile = Join-Path $Root '.env'
if (-not (Test-Path $envFile)) {
  Write-Host "No root .env found. Copy .env.example to .env first." -ForegroundColor Yellow
  exit 1
}

# Prefer psql if on PATH
$psql = Get-Command psql -ErrorAction SilentlyContinue
if (-not $psql) {
  Write-Host "psql not found on PATH. Ensure PostgreSQL bin folder is installed and on PATH." -ForegroundColor Yellow
  Write-Host "Expected: host localhost:5432 database gamemania" -ForegroundColor Yellow
  exit 1
}

Write-Host "Checking PostgreSQL connection..."
& psql -h localhost -p 5432 -U gamemania -d gamemania -c "SELECT 1 AS ok;" 
if ($LASTEXITCODE -ne 0) {
  Write-Host "Connection failed. Create user/database from .env.example values." -ForegroundColor Red
  exit 1
}

Write-Host "PostgreSQL is ready on localhost:5432." -ForegroundColor Green
Write-Host "Next:"
Write-Host "  cd backend; npm install; npm run prisma:migrate; npm run dev   # :5000"
Write-Host "  cd frontend; npm install; npm run dev                           # :3000"
Write-Host "  cd admin; npm install; npm run dev                              # :3001"
