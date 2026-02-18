@echo off
REM ============================================
REM Azure PostgreSQL Migration Script Runner
REM ============================================

SET PGHOST=psql-sms-dev-sci1tp18.postgres.database.azure.com
SET PGPORT=5432
SET PGDATABASE=school_management
SET PGUSER=smsadmin
SET PGPASSWORD=MySchool@Azure2026
SET PGSSLMODE=require

REM Add PostgreSQL bin to PATH temporarily
SET PATH=%PATH%;C:\Program Files\PostgreSQL\17\bin

echo.
echo ============================================
echo Running Azure PostgreSQL Migration...
echo ============================================
echo Host: %PGHOST%
echo Database: %PGDATABASE%
echo User: %PGUSER%
echo SSL Mode: %PGSSLMODE%
echo ============================================
echo.

REM Test connection first
echo Testing connection...
psql -c "SELECT version();"

IF %ERRORLEVEL% NEQ 0 (
    echo.
    echo ERROR: Could not connect to database
    echo Please check:
    echo   1. Firewall rules (your IP: must be whitelisted)
    echo   2. Server is running
    echo   3. Credentials are correct
    echo.
    pause
    exit /b 1
)

echo.
echo Connection successful!
echo.
echo Running migration script...
echo.

psql -f migrate-to-azure.sql

IF %ERRORLEVEL% NEQ 0 (
    echo.
    echo ERROR: Migration failed
    echo Check the error messages above
    echo.
    pause
    exit /b 1
)

echo.
echo ============================================
echo Migration completed successfully!
echo ============================================
echo.
echo Verifying tables...
psql -c "\dt"

echo.
echo Checking seed data...
psql -c "SELECT COUNT(*) as school_count FROM schools;"
psql -c "SELECT COUNT(*) as student_count FROM students;"
psql -c "SELECT COUNT(*) as user_count FROM users;"

echo.
echo ============================================
echo Done! Database is ready for use.
echo ============================================
echo.
pause
