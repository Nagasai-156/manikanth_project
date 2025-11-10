# Test Script for Simplified Experience Form
Write-Host "`n🧪 TESTING SIMPLIFIED EXPERIENCE FORM" -ForegroundColor Cyan
Write-Host "=" * 60 -ForegroundColor Gray

# Login
Write-Host "`n1️⃣  Logging in..." -ForegroundColor Yellow
try {
    $loginResponse = Invoke-RestMethod -Uri "http://localhost:5000/api/auth/login" -Method POST -ContentType "application/json" -Body '{"email":"student@college.edu","password":"student123"}'
    $token = $loginResponse.data.accessToken
    Write-Host "   ✅ Login successful" -ForegroundColor Green
} catch {
    Write-Host "   ❌ Login failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Test 1: Minimal Data (Only Required Fields)
Write-Host "`n2️⃣  TEST 1: Minimal Data (Only Required Fields)" -ForegroundColor Yellow
$minimalData = @{
    companyId = "other"
    customCompany = "TestCompany"
    role = "SDE"
    experienceType = "Internship"
    result = "Selected"
} | ConvertTo-Json

try {
    $result1 = Invoke-RestMethod -Uri "http://localhost:5000/api/experiences" -Method POST -ContentType "application/json" -Headers @{Authorization="Bearer $token"} -Body $minimalData
    Write-Host "   ✅ TEST 1 PASSED" -ForegroundColor Green
    Write-Host "   Experience ID: $($result1.data.experience.id)" -ForegroundColor Gray
} catch {
    Write-Host "   ❌ TEST 1 FAILED: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 2: With Optional Fields
Write-Host "`n3️⃣  TEST 2: With Optional Fields" -ForegroundColor Yellow
$fullData = @{
    companyId = "other"
    customCompany = "AnotherCompany"
    role = "Data Analyst"
    experienceType = "Full-Time"
    result = "Not Selected"
    interviewDate = "2025-01-15"
    location = "Bangalore"
    overallExperience = "The interview had 3 rounds"
    technicalRounds = "Asked about SQL and Python"
    hrRounds = "Standard HR questions"
    tipsAndAdvice = "Practice SQL queries"
} | ConvertTo-Json

try {
    $result2 = Invoke-RestMethod -Uri "http://localhost:5000/api/experiences" -Method POST -ContentType "application/json" -Headers @{Authorization="Bearer $token"} -Body $fullData
    Write-Host "   ✅ TEST 2 PASSED" -ForegroundColor Green
    Write-Host "   Experience ID: $($result2.data.experience.id)" -ForegroundColor Gray
} catch {
    Write-Host "   ❌ TEST 2 FAILED: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 3: Empty Optional Fields
Write-Host "`n4️⃣  TEST 3: Empty Optional Fields" -ForegroundColor Yellow
$emptyOptionalData = @{
    companyId = "other"
    customCompany = "EmptyFieldsCompany"
    role = "Software Engineer"
    experienceType = "Apprenticeship"
    result = "Pending"
    interviewDate = ""
    location = ""
    overallExperience = ""
    technicalRounds = ""
    hrRounds = ""
    tipsAndAdvice = ""
} | ConvertTo-Json

try {
    $result3 = Invoke-RestMethod -Uri "http://localhost:5000/api/experiences" -Method POST -ContentType "application/json" -Headers @{Authorization="Bearer $token"} -Body $emptyOptionalData
    Write-Host "   ✅ TEST 3 PASSED" -ForegroundColor Green
    Write-Host "   Experience ID: $($result3.data.experience.id)" -ForegroundColor Gray
} catch {
    Write-Host "   ❌ TEST 3 FAILED: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 4: Long Text Content
Write-Host "`n5️⃣  TEST 4: Long Text Content" -ForegroundColor Yellow
$longText = "This is a very long text. " * 100
$longTextData = @{
    companyId = "other"
    customCompany = "LongTextCompany"
    role = "Full Stack Developer"
    experienceType = "Full-Time"
    result = "Selected"
    overallExperience = $longText
    technicalRounds = $longText
    hrRounds = $longText
    tipsAndAdvice = $longText
} | ConvertTo-Json

try {
    $result4 = Invoke-RestMethod -Uri "http://localhost:5000/api/experiences" -Method POST -ContentType "application/json" -Headers @{Authorization="Bearer $token"} -Body $longTextData
    Write-Host "   ✅ TEST 4 PASSED" -ForegroundColor Green
    Write-Host "   Experience ID: $($result4.data.experience.id)" -ForegroundColor Gray
} catch {
    Write-Host "   ❌ TEST 4 FAILED: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n" + ("=" * 60) -ForegroundColor Gray
Write-Host "🎉 TESTING COMPLETE!" -ForegroundColor Cyan
Write-Host "`n📝 Summary:" -ForegroundColor Yellow
Write-Host "   - All tests check different scenarios" -ForegroundColor Gray
Write-Host "   - If all passed, the form is working perfectly!" -ForegroundColor Gray
Write-Host "   - You can now use the application" -ForegroundColor Gray
Write-Host "`n"
