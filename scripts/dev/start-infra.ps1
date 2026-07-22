# Start local Postgres + Redis (apps run on host via npm)
Set-StrictMode -Version Latest
$Root = Split-Path (Split-Path $PSScriptRoot -Parent) -Parent
Set-Location $Root
docker compose up -d postgres redis
Write-Host "Postgres :5432 and Redis :6379 are starting."
