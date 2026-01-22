# Reset and Create Baseline Migration Script (PowerShell)
# WARNING: This will delete all data! Only use in development.

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "Database Reset & Baseline Migration" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "This script will:" -ForegroundColor Yellow
Write-Host "1. Delete old deprecated migrations" -ForegroundColor Yellow
Write-Host "2. Delete ALL existing data" -ForegroundColor Yellow
Write-Host "3. Drop all tables" -ForegroundColor Yellow
Write-Host "4. Create fresh baseline migration" -ForegroundColor Yellow
Write-Host ""
Write-Host "WARNING: This is DESTRUCTIVE!" -ForegroundColor Red
Write-Host ""

$confirm = Read-Host "Are you sure? (type 'yes' to continue)"

if ($confirm -ne "yes") {
    Write-Host "Cancelled." -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Step 1: Backing up old migrations..." -ForegroundColor Green
$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$backupDir = "prisma\migrations_backup_$timestamp"

if (Test-Path "prisma\migrations") {
    New-Item -ItemType Directory -Force -Path $backupDir | Out-Null
    Copy-Item -Path "prisma\migrations\*" -Destination $backupDir -Recurse -Force
    Write-Host "Old migrations backed up to: $backupDir" -ForegroundColor Green
}

Write-Host ""
Write-Host "Step 2: Deleting old migrations..." -ForegroundColor Green
if (Test-Path "prisma\migrations") {
    Remove-Item -Path "prisma\migrations" -Recurse -Force
    Write-Host "Old migrations deleted" -ForegroundColor Green
}

Write-Host ""
Write-Host "Step 3: Resetting database..." -ForegroundColor Green
npx prisma migrate reset --force --skip-seed

Write-Host ""
Write-Host "Step 4: Creating baseline migration..." -ForegroundColor Green
npx prisma migrate dev --name complete_schema_baseline

Write-Host ""
Write-Host "Step 5: Generating Prisma Client..." -ForegroundColor Green
npx prisma generate

Write-Host ""
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "Migration complete!" -ForegroundColor Green
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "What was done:" -ForegroundColor Yellow
Write-Host "- Old migrations backed up to: $backupDir" -ForegroundColor Green
Write-Host "- Old migrations deleted" -ForegroundColor Green
Write-Host "- Database reset" -ForegroundColor Green
Write-Host "- New baseline migration created" -ForegroundColor Green
Write-Host "- Prisma client generated" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Review the new migration in prisma/migrations/" -ForegroundColor Yellow
Write-Host "2. Commit the new migration files to git" -ForegroundColor Yellow
Write-Host "3. For production use: npx prisma migrate deploy" -ForegroundColor Yellow
Write-Host ""
Write-Host "Note: Old migrations backed up to $backupDir" -ForegroundColor Cyan
Write-Host ""
