# GAME-MANIA local smoke test (Windows PowerShell)
# Prerequisites: backend on :5000, PostgreSQL seeded

$ErrorActionPreference = 'Stop'
$base = 'http://localhost:5000/api/v1'

Write-Host '== health =='
$health = Invoke-RestMethod "$base/health"
if (-not $health.success) { throw 'Health failed' }

Write-Host '== login =='
$login = Invoke-RestMethod -Method Post -Uri "$base/auth/login" -ContentType 'application/json' -Body '{"email":"demo@gamemania.com","password":"ChangeMe123!"}'
$token = $login.data.accessToken
if (-not $token) { throw 'Login failed' }
$headers = @{ Authorization = "Bearer $token" }

Write-Host '== products =='
$products = Invoke-RestMethod "$base/products?limit=5"
$productId = $products.data[0].id
if (-not $productId) { throw 'No products' }

Write-Host '== add cart =='
$guest = [guid]::NewGuid().ToString()
$cartHeaders = @{ Authorization = "Bearer $token"; 'X-Guest-Id' = $guest }
Invoke-RestMethod -Method Post -Uri "$base/cart/items" -Headers $cartHeaders -ContentType 'application/json' -Body (@{ productId = $productId; quantity = 1 } | ConvertTo-Json) | Out-Null

Write-Host '== addresses =='
$addresses = Invoke-RestMethod -Uri "$base/users/me/addresses" -Headers $headers
$addressId = $addresses.data[0].id
if (-not $addressId) { throw 'Demo user needs a seeded address' }

Write-Host '== checkout preview =='
$preview = Invoke-RestMethod -Method Post -Uri "$base/checkout/preview" -Headers $headers -ContentType 'application/json' -Body (@{
  shippingAddressId = $addressId
  couponCode = 'WELCOME10'
  country = 'GB'
} | ConvertTo-Json)
if (-not $preview.data.grandTotalPence -and $preview.data.grandTotalPence -ne 0) {
  throw 'Preview missing grandTotalPence'
}

Write-Host '== place order =='
$order = Invoke-RestMethod -Method Post -Uri "$base/checkout" -Headers $headers -ContentType 'application/json' -Body (@{
  shippingAddressId = $addressId
  couponCode = 'WELCOME10'
  country = 'GB'
} | ConvertTo-Json)

Write-Host "OK order $($order.data.order.orderNumber) total $($preview.data.grandTotalPence)p"
Write-Host 'Smoke test passed.'
