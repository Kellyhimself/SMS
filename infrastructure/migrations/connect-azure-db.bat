@echo off
REM ============================================
REM Azure PostgreSQL Connection Script
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
echo Connecting to Azure PostgreSQL...
echo ============================================
echo Host: %PGHOST%
echo Database: %PGDATABASE%
echo User: %PGUSER%
echo SSL Mode: %PGSSLMODE%
echo ============================================
echo.

psql
