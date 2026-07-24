# Removes leftover empty root admin/ folder (standalone app deleted; UI is frontend /admin).
# Run from repo root if Explorer/Cursor still shows an empty admin directory:
#   powershell -ExecutionPolicy Bypass -File scripts/dev/remove-empty-admin.ps1

$target = Join-Path (Split-Path $PSScriptRoot -Parent | Split-Path -Parent) 'admin'
if (-not (Test-Path -LiteralPath $target)) {
  Write-Host "No admin folder at $target — already gone."
  exit 0
}

$items = Get-ChildItem -LiteralPath $target -Force -ErrorAction SilentlyContinue
if ($items -and $items.Count -gt 0) {
  Write-Host "Refusing to delete: $target is not empty."
  exit 1
}

try {
  Remove-Item -LiteralPath $target -Force -ErrorAction Stop
  Write-Host "Deleted empty $target"
} catch {
  Write-Host "Could not delete (file lock). Close Cursor/terminals using that path, then re-run."
  Write-Host $_.Exception.Message
  exit 1
}
