# Test Azure PostgreSQL Connection

$env:PGHOST = "psql-sms-dev-sci1tp18.postgres.database.azure.com"
$env:PGPORT = "5432"
$env:PGDATABASE = "school_management"
$env:PGUSER = "smsadmin"
$env:PGPASSWORD = "MySchool@Azure2026"
$env:PGSSLMODE = "require"

$psqlPath = "C:\Program Files\PostgreSQL\17\bin\psql.exe"

Write-Host ""
Write-Host "Testing Azure PostgreSQL Connection..." -ForegroundColor Cyan
Write-Host "Host: $env:PGHOST"
Write-Host "Database: $env:PGDATABASE"
Write-Host ""

& $psqlPath -c "SELECT version();"

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "Connection successful!" -ForegroundColor Green
    Write-Host ""
} else {
    Write-Host ""
    Write-Host "Connection failed!" -ForegroundColor Red
    Write-Host "Check firewall rules and credentials" -ForegroundColor Yellow
    Write-Host ""
}
