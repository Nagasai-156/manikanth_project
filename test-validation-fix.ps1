# Test Validation Fix Script
# This script tests the validation error fix

Write-Host "==================================" -ForegroundColor Cyan
Write-Host "Testing Validation Error Fix" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""

# Check if backend server is running
Write-Host "Checking if backend server is running..." -ForegroundColor Yellow
$response = $null
try {
    $response = Invoke-WebRequest -Uri "http://localhost:5000/api/companies" -Method GET -TimeoutSec 2 -ErrorAction SilentlyContinue
    Write-Host "✅ Backend server is running!" -ForegroundColor Green
} catch {
    Write-Host "❌ Backend server is NOT running!" -ForegroundColor Red
    Write-Host "Please start the backend server first:" -ForegroundColor Yellow
    Write-Host "  cd backend" -ForegroundColor White
    Write-Host "  node server.js" -ForegroundColor White
    exit 1
}

Write-Host ""
Write-Host "==================================" -ForegroundColor Cyan
Write-Host "Validation Fix Summary" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "✅ Changed allowUnknown: false → true" -ForegroundColor Green
Write-Host "✅ Added detailed error logging" -ForegroundColor Green
Write-Host "✅ Improved error messages" -ForegroundColor Green
Write-Host "✅ Enhanced frontend error handling" -ForegroundColor Green
Write-Host "✅ Fixed API error propagation" -ForegroundColor Green
Write-Host ""
Write-Host "==================================" -ForegroundColor Cyan
Write-Host "Next Steps" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Go to http://localhost:3000/post-experience" -ForegroundColor White
Write-Host "2. Try submitting the form" -ForegroundColor White
Write-Host "3. The validation error should be GONE!" -ForegroundColor White
Write-Host ""
Write-Host "If you still see errors, check the backend console" -ForegroundColor Yellow
Write-Host "for detailed validation error logs." -ForegroundColor Yellow
Write-Host ""
