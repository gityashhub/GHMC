# Database Reset Script for Windows PowerShell
# Usage: .\reset-database.ps1 -NewDbName "your_new_db_name"

param(
    [Parameter(Mandatory=$true)]
    [string]$NewDbName,
    
    [string]$OldDbName = "chemwaste_db",
    [string]$PostgresUser = "postgres"
)

Write-Host "🔄 Database Reset Script" -ForegroundColor Cyan
Write-Host ""

# Step 1: Drop old database
Write-Host "Step 1: Dropping old database '$OldDbName'..." -ForegroundColor Yellow
try {
    $dropResult = psql -U $PostgresUser -c "DROP DATABASE IF EXISTS $OldDbName;" 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Old database dropped successfully" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Warning: Could not drop old database (might not exist)" -ForegroundColor Yellow
        Write-Host $dropResult
    }
} catch {
    Write-Host "❌ Error dropping database: $_" -ForegroundColor Red
    Write-Host "You may need to drop it manually using: psql -U $PostgresUser -c 'DROP DATABASE IF EXISTS $OldDbName;'" -ForegroundColor Yellow
}

Write-Host ""

# Step 2: Create new database
Write-Host "Step 2: Creating new database '$NewDbName'..." -ForegroundColor Yellow
try {
    $createResult = createdb -U $PostgresUser $NewDbName 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ New database '$NewDbName' created successfully" -ForegroundColor Green
    } else {
        Write-Host "❌ Error creating database: $createResult" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "❌ Error: $_" -ForegroundColor Red
    Write-Host "You may need to create it manually using: createdb -U $PostgresUser $NewDbName" -ForegroundColor Yellow
    exit 1
}

Write-Host ""

# Step 3: Update .env file
Write-Host "Step 3: Updating .env file..." -ForegroundColor Yellow
if (Test-Path ".env") {
    $envContent = Get-Content ".env" -Raw
    $newEnvContent = $envContent -replace "chemwaste_db", $NewDbName
    
    if ($envContent -ne $newEnvContent) {
        Set-Content -Path ".env" -Value $newEnvContent -NoNewline
        Write-Host "✅ .env file updated with new database name" -ForegroundColor Green
    } else {
        Write-Host "⚠️  .env file doesn't contain old database name" -ForegroundColor Yellow
    }
} else {
    Write-Host "⚠️  .env file not found. Please create it from .env.example" -ForegroundColor Yellow
    Write-Host "   Make sure to set: DATABASE_URL=postgresql://user:password@localhost:5432/$NewDbName?schema=public" -ForegroundColor Yellow
}

Write-Host ""

# Step 4: Remove migrations if they exist
Write-Host "Step 4: Cleaning up migrations..." -ForegroundColor Yellow
if (Test-Path "prisma/migrations") {
    Remove-Item -Recurse -Force "prisma/migrations"
    Write-Host "✅ Old migrations removed" -ForegroundColor Green
} else {
    Write-Host "ℹ️  No migrations folder found (this is fine)" -ForegroundColor Cyan
}

Write-Host ""

# Step 5: Instructions
Write-Host "📋 Next Steps:" -ForegroundColor Cyan
Write-Host "1. Make sure your .env file has the correct DATABASE_URL:" -ForegroundColor White
Write-Host "   DATABASE_URL=postgresql://user:password@localhost:5432/$NewDbName?schema=public" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Generate Prisma Client:" -ForegroundColor White
Write-Host "   npm run generate" -ForegroundColor Gray
Write-Host ""
Write-Host "3. Run migrations:" -ForegroundColor White
Write-Host "   npm run migrate" -ForegroundColor Gray
Write-Host ""

