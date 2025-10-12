@echo off
title Nirapoth Database Setup

echo 🚀 Nirapoth Database Setup Script
echo ==================================
echo.

REM Check if PostgreSQL is available
psql --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ PostgreSQL is not installed or not in PATH
    echo Please install PostgreSQL first:
    echo   - Download from https://www.postgresql.org/download/windows/
    echo   - Make sure to add PostgreSQL to your system PATH
    pause
    exit /b 1
)

echo ✅ PostgreSQL found
echo.

REM Default values
set DEFAULT_DB_NAME=nirapoth_db
set DEFAULT_DB_USER=nirapoth_user
set DEFAULT_DB_PASSWORD=secure_password_123

REM Get database details from user
set /p DB_NAME="Enter database name [%DEFAULT_DB_NAME%]: "
if "%DB_NAME%"=="" set DB_NAME=%DEFAULT_DB_NAME%

set /p DB_USER="Enter database user [%DEFAULT_DB_USER%]: "
if "%DB_USER%"=="" set DB_USER=%DEFAULT_DB_USER%

set /p DB_PASSWORD="Enter password for user '%DB_USER%' [%DEFAULT_DB_PASSWORD%]: "
if "%DB_PASSWORD%"=="" set DB_PASSWORD=%DEFAULT_DB_PASSWORD%

set /p ADMIN_PASSWORD="Enter PostgreSQL admin password (for 'postgres' user): "

echo.
echo 📋 Creating database and user...

REM Create temporary SQL file
echo CREATE DATABASE %DB_NAME%; > temp_setup.sql
echo CREATE USER %DB_USER% WITH PASSWORD '%DB_PASSWORD%'; >> temp_setup.sql
echo GRANT ALL PRIVILEGES ON DATABASE %DB_NAME% TO %DB_USER%; >> temp_setup.sql
echo \c %DB_NAME% >> temp_setup.sql
echo GRANT ALL ON SCHEMA public TO %DB_USER%; >> temp_setup.sql
echo GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO %DB_USER%; >> temp_setup.sql
echo GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO %DB_USER%; >> temp_setup.sql

REM Execute SQL commands
set PGPASSWORD=%ADMIN_PASSWORD%
psql -U postgres -h localhost -f temp_setup.sql

if %errorlevel% equ 0 (
    echo ✅ Database setup completed successfully!
    
    REM Create DATABASE_URL
    set DATABASE_URL=postgresql://%DB_USER%:%DB_PASSWORD%@localhost:5432/%DB_NAME%
    
    REM Update .env file
    if exist ".env" (
        echo DATABASE_URL="%DATABASE_URL%" > .env.new
        if exist ".env.example" (
            findstr /v "^DATABASE_URL=" .env.example >> .env.new
        )
        move .env.new .env
        echo ✅ Updated .env file with new database URL
    ) else (
        if exist ".env.example" (
            copy .env.example .env
            echo DATABASE_URL="%DATABASE_URL%" > .env.temp
            findstr /v "^DATABASE_URL=" .env >> .env.temp
            move .env.temp .env
            echo ✅ Created .env file from template
        ) else (
            echo # Database Configuration > .env
            echo DATABASE_URL="%DATABASE_URL%" >> .env
            echo. >> .env
            echo # Server Configuration >> .env
            echo PORT=3000 >> .env
            echo NODE_ENV=development >> .env
            echo ✅ Created basic .env file
        )
    )
    
    echo.
    echo 🔧 Next steps:
    echo 1. Run 'pnpm run prisma:generate' to generate Prisma client
    echo 2. Run 'pnpm run prisma:migrate dev --name init' to create initial migration
    echo 3. Run 'pnpm run dev' to start the development server
    echo.
    echo 📊 Database Details:
    echo   Database: %DB_NAME%
    echo   User: %DB_USER%
    echo   Connection: localhost:5432
    
) else (
    echo ❌ Failed to create database. Please check your PostgreSQL installation and admin password.
)

REM Clean up temporary file
if exist temp_setup.sql del temp_setup.sql

echo.
pause