# Run Azure PostgreSQL Migration

$env:PGHOST = "psql-sms-dev-sci1tp18.postgres.database.azure.com"
$env:PGPORT = "5432"
$env:PGDATABASE = "school_management"
$env:PGUSER = "smsadmin"
$env:PGPASSWORD = "MySchool@Azure2026"
$env:PGSSLMODE = "require"

$psqlPath = "C:\Program Files\PostgreSQL\17\bin\psql.exe"

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "Running Azure PostgreSQL Migration..." -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

& $psqlPath -f migrate-to-azure.sql

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "Verifying migration..." -ForegroundColor Yellow
    Write-Host ""

    Write-Host "Tables created:" -ForegroundColor Green
    & $psqlPath -c "\dt"

    Write-Host ""
    Write-Host "Checking seed data:" -ForegroundColor Green
    & $psqlPath -c "SELECT 'Schools:' as table_name, COUNT(*)::text as count FROM schools UNION ALL SELECT 'Students:', COUNT(*)::text FROM students UNION ALL SELECT 'Users:', COUNT(*)::text FROM users;"

    Write-Host ""
    Write-Host "============================================" -ForegroundColor Green
    Write-Host "Migration completed successfully!" -ForegroundColor Green
    Write-Host "============================================" -ForegroundColor Green
    Write-Host ""
} else {
    Write-Host ""
    Write-Host "Migration failed!" -ForegroundColor Red
    Write-Host ""
}
