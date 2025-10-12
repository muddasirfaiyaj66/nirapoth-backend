# Database Setup Guide

## PostgreSQL Installation and Configuration

### 1. Install PostgreSQL

#### On Windows:

1. Download PostgreSQL from [official website](https://www.postgresql.org/download/windows/)
2. Run the installer and follow the setup wizard
3. Remember the password you set for the `postgres` user
4. Add PostgreSQL to your PATH if not done automatically

#### On macOS:

```bash
# Using Homebrew
brew install postgresql
brew services start postgresql
```

#### On Ubuntu/Debian:

```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

### 2. Create Database and User

1. **Connect to PostgreSQL as superuser:**

   ```bash
   psql -U postgres
   ```

2. **Create database and user:**

   ```sql
   -- Create the database
   CREATE DATABASE nirapoth_db;

   -- Create user with password
   CREATE USER nirapoth_user WITH PASSWORD 'secure_password_123';

   -- Grant all privileges on the database to the user
   GRANT ALL PRIVILEGES ON DATABASE nirapoth_db TO nirapoth_user;

   -- Grant schema privileges
   \c nirapoth_db
   GRANT ALL ON SCHEMA public TO nirapoth_user;
   GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO nirapoth_user;
   GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO nirapoth_user;

   -- Exit psql
   \q
   ```

### 3. Verify Connection

Test your database connection:

```bash
psql -U nirapoth_user -d nirapoth_db -h localhost -p 5432
```

### 4. Environment Configuration

Update your `.env` file with the correct database URL:

```env
# Database Configuration
DATABASE_URL="postgresql://nirapoth_user:secure_password_123@localhost:5432/nirapoth_db"
```

### 5. Database URL Format

The PostgreSQL connection string format is:

```
postgresql://[username[:password]@][hostname[:port]][/database_name][?parameter_list]
```

**Components:**

- `username`: Database user (e.g., `nirapoth_user`)
- `password`: User password (e.g., `secure_password_123`)
- `hostname`: Database server hostname (e.g., `localhost`)
- `port`: Database server port (default: `5432`)
- `database_name`: Target database (e.g., `nirapoth_db`)

### 6. Production Configuration

For production environments, consider these additional settings:

#### Connection Pooling

```env
DATABASE_URL="postgresql://nirapoth_user:secure_password_123@localhost:5432/nirapoth_db?connection_limit=20&pool_timeout=20"
```

#### SSL Configuration

```env
DATABASE_URL="postgresql://nirapoth_user:secure_password_123@localhost:5432/nirapoth_db?sslmode=require"
```

### 7. Common Commands

#### Database Management

```sql
-- List all databases
\l

-- Connect to a database
\c database_name

-- List tables in current database
\dt

-- Describe table structure
\d table_name

-- Show current database
SELECT current_database();

-- Show current user
SELECT current_user;
```

#### User Management

```sql
-- Create new user
CREATE USER new_user WITH PASSWORD 'password';

-- Grant permissions
GRANT ALL PRIVILEGES ON DATABASE database_name TO user_name;

-- List all users
\du

-- Change user password
ALTER USER user_name WITH PASSWORD 'new_password';
```

### 8. Backup and Restore

#### Backup Database

```bash
pg_dump -U nirapoth_user -h localhost -d nirapoth_db > backup.sql
```

#### Restore Database

```bash
psql -U nirapoth_user -h localhost -d nirapoth_db < backup.sql
```

### 9. Troubleshooting

#### Common Issues

1. **Connection refused:**

   - Check if PostgreSQL service is running
   - Verify port 5432 is not blocked by firewall
   - Check `postgresql.conf` for `listen_addresses`

2. **Authentication failed:**

   - Verify username and password
   - Check `pg_hba.conf` for authentication methods
   - Ensure user has proper permissions

3. **Database does not exist:**
   - Verify database name spelling
   - Check if database was created successfully
   - Use `\l` to list all available databases

#### Check PostgreSQL Status

```bash
# On Linux/macOS
sudo systemctl status postgresql

# On Windows (Command Prompt as Administrator)
sc query postgresql-x64-14
```

#### View PostgreSQL Logs

```bash
# On Linux
sudo journalctl -u postgresql

# On Windows
# Check Windows Event Viewer or PostgreSQL log directory
```

### 10. Performance Tuning (Production)

Basic PostgreSQL configuration for better performance:

```sql
-- In postgresql.conf or via SQL
ALTER SYSTEM SET shared_buffers = '256MB';
ALTER SYSTEM SET effective_cache_size = '1GB';
ALTER SYSTEM SET maintenance_work_mem = '64MB';
ALTER SYSTEM SET checkpoint_completion_target = 0.9;
ALTER SYSTEM SET wal_buffers = '16MB';
ALTER SYSTEM SET default_statistics_target = 100;

-- Reload configuration
SELECT pg_reload_conf();
```

### 11. Prisma-Specific Commands

After setting up PostgreSQL, use these Prisma commands:

```bash
# Generate Prisma client
pnpm run prisma:generate

# Create and apply migrations
pnpm run prisma:migrate dev --name init

# Deploy migrations to production
pnpm run prisma:migrate deploy

# Reset database (development only)
pnpm run prisma:migrate reset

# Open Prisma Studio
pnpm run prisma:studio

# Push schema changes without migrations
pnpm run db:push
```

---

## Security Best Practices

1. **Use strong passwords** for database users
2. **Limit database user privileges** to only what's necessary
3. **Use SSL/TLS** in production environments
4. **Regularly backup** your database
5. **Keep PostgreSQL updated** to the latest version
6. **Monitor database logs** for suspicious activity
7. **Use connection pooling** to prevent connection exhaustion
8. **Configure firewall rules** to restrict database access
