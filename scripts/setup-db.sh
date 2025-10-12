#!/bin/bash

# Database Setup Script for Nirapoth Backend
# This script helps set up PostgreSQL database for development

echo "🚀 Nirapoth Database Setup Script"
echo "=================================="

# Check if PostgreSQL is installed
if ! command -v psql &> /dev/null; then
    echo "❌ PostgreSQL is not installed or not in PATH"
    echo "Please install PostgreSQL first:"
    echo "  - Windows: Download from https://www.postgresql.org/download/windows/"
    echo "  - macOS: brew install postgresql"
    echo "  - Ubuntu: sudo apt install postgresql postgresql-contrib"
    exit 1
fi

echo "✅ PostgreSQL found"

# Default values
DEFAULT_DB_NAME="nirapoth_db"
DEFAULT_DB_USER="nirapoth_user"
DEFAULT_DB_PASSWORD="secure_password_123"

# Get database details from user
read -p "Enter database name [$DEFAULT_DB_NAME]: " DB_NAME
DB_NAME=${DB_NAME:-$DEFAULT_DB_NAME}

read -p "Enter database user [$DEFAULT_DB_USER]: " DB_USER
DB_USER=${DB_USER:-$DEFAULT_DB_USER}

read -s -p "Enter password for user '$DB_USER' [$DEFAULT_DB_PASSWORD]: " DB_PASSWORD
DB_PASSWORD=${DB_PASSWORD:-$DEFAULT_DB_PASSWORD}
echo

read -s -p "Enter PostgreSQL admin password (for 'postgres' user): " ADMIN_PASSWORD
echo

# Create database and user
echo "📋 Creating database and user..."

PGPASSWORD=$ADMIN_PASSWORD psql -U postgres -h localhost <<EOF
-- Create database
CREATE DATABASE $DB_NAME;

-- Create user
CREATE USER $DB_USER WITH PASSWORD '$DB_PASSWORD';

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;

-- Connect to the database and grant schema privileges
\c $DB_NAME
GRANT ALL ON SCHEMA public TO $DB_USER;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO $DB_USER;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO $DB_USER;

EOF

if [ $? -eq 0 ]; then
    echo "✅ Database setup completed successfully!"
    
    # Update .env file
    DATABASE_URL="postgresql://$DB_USER:$DB_PASSWORD@localhost:5432/$DB_NAME"
    
    if [ -f ".env" ]; then
        # Update existing .env file
        sed -i.bak "s|^DATABASE_URL=.*|DATABASE_URL=\"$DATABASE_URL\"|" .env
        echo "✅ Updated .env file with new database URL"
    else
        # Create new .env file from template
        if [ -f ".env.example" ]; then
            cp .env.example .env
            sed -i.bak "s|^DATABASE_URL=.*|DATABASE_URL=\"$DATABASE_URL\"|" .env
            echo "✅ Created .env file from template"
        else
            # Create basic .env file
            cat > .env <<EOF
# Database Configuration
DATABASE_URL="$DATABASE_URL"

# Server Configuration
PORT=3000
NODE_ENV=development
EOF
            echo "✅ Created basic .env file"
        fi
    fi
    
    echo
    echo "🔧 Next steps:"
    echo "1. Run 'pnpm run prisma:generate' to generate Prisma client"
    echo "2. Run 'pnpm run prisma:migrate dev --name init' to create initial migration"
    echo "3. Run 'pnpm run dev' to start the development server"
    echo
    echo "📊 Database Details:"
    echo "  Database: $DB_NAME"
    echo "  User: $DB_USER"
    echo "  Connection: localhost:5432"
    
else
    echo "❌ Failed to create database. Please check your PostgreSQL installation and admin password."
    exit 1
fi