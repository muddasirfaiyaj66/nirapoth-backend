# Vercel Deployment Guide for Nirapoth Backend

## 🎯 Overview

This guide explains how to deploy the Nirapoth Backend to Vercel with proper superadmin initialization.

## 🔧 Changes Made for Vercel Compatibility

### 1. **Serverless-Optimized Seeding**

- Seeding now runs **only in development** during server startup
- In production (Vercel), seeding must be done manually via API or script
- Added instance-level caching to prevent multiple seeding attempts
- Optimized for serverless cold starts

### 2. **Files Modified**

#### `src/services/seed.service.ts`

- Added `seedingAttempted` and `seedingPromise` flags for deduplication
- Implemented `runStartupSeeding()` with serverless optimization
- Added `ensureCriticalDataExists()` for quick checks
- Prevents Prisma disconnection in production

#### `src/index.ts`

- Seeding only runs in `development` environment
- Production seeding happens via manual script or first deployment

#### `package.json`

- Added `postinstall` script for Prisma generation
- `vercel-build` generates Prisma client and compiles TypeScript

## 📋 Deployment Steps

### Step 1: Prepare Your Environment Variables

Make sure these are set in your Vercel project:

```bash
# Database Configuration
DATABASE_URL="your-postgres-connection-string"

# JWT Configuration
JWT_SECRET="your-super-secret-jwt-key"
JWT_REFRESH_SECRET="your-super-secret-refresh-key"
JWT_EXPIRES_IN="15m"
JWT_REFRESH_EXPIRES_IN="7d"

# Server Configuration
NODE_ENV="production"

# CORS Configuration
CORS_ORIGIN="https://your-frontend-domain.vercel.app"

# Super Admin Configuration
SUPER_ADMIN_EMAIL="your-admin@email.com"
SUPER_ADMIN_PASSWORD="your-secure-password"
SUPER_ADMIN_FIRST_NAME="FirstName"
SUPER_ADMIN_LAST_NAME="LastName"
SUPER_ADMIN_PHONE="01234567890"

# Email Configuration
EMAIL_SEND_USER_EMAIL="your-email@gmail.com"
EMAIL_SEND_USER_PASS="your-app-password"
BASE_URL="https://your-frontend-domain.vercel.app"
FRONTEND_URL="https://your-frontend-domain.vercel.app"
BACKEND_URL="https://your-backend-domain.vercel.app"

# Payment Configuration (SSLCommerz)
STORE_ID="your-store-id"
STORE_PASSWORD="your-store-password"
SSLCOMMERZ_API_URL="https://sandbox.sslcommerz.com"
SSLCOMMERZ_VALIDATION_URL="https://sandbox.sslcommerz.com/validator/api/validationserverAPI.php"
SSLCOMMERZ_TRANSACTION_STATUS_URL="https://sandbox.sslcommerz.com/validator/api/merchantTransIDvalidationAPI.php"
PAYMENT_SUCCESS_URL="https://your-frontend-domain.vercel.app/api/payment-callback/success"
PAYMENT_FAIL_URL="https://your-frontend-domain.vercel.app/api/payment-callback/failed"
PAYMENT_CANCEL_URL="https://your-frontend-domain.vercel.app/api/payment-callback/cancelled"
PAYMENT_IPN_URL="https://your-backend-domain.vercel.app/api/payments/ipn"
CURRENCY="BDT"
PAYMENT_TIMEOUT="30"
```

### Step 2: Deploy to Vercel

#### Option A: Using Vercel CLI

```bash
# Install Vercel CLI
npm install -g vercel

# Navigate to backend directory
cd nirapoth-backend

# Deploy
vercel --prod
```

#### Option B: Using Vercel Dashboard

1. Go to [vercel.com](https://vercel.com)
2. Import your Git repository
3. Select the `nirapoth-backend` directory as root
4. Add all environment variables from Step 1
5. Deploy

### Step 3: Initialize Database (First Time Only)

After your first deployment, you need to seed the database. Choose one of these methods:

#### Method 1: Run Seed Script Locally (Recommended)

```bash
# Make sure your DATABASE_URL points to the production database
npm run seed
```

#### Method 2: Create a Temporary Seed Endpoint (Advanced)

Add this temporary route to trigger seeding:

```typescript
// In src/index.ts - TEMPORARY ONLY
app.get("/api/admin/seed-database", async (req, res) => {
  try {
    await SeedService.initializeDatabase();
    res.json({ success: true, message: "Database seeded successfully" });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});
```

Then visit: `https://your-backend-domain.vercel.app/api/admin/seed-database`

**⚠️ IMPORTANT: Remove this endpoint after seeding!**

#### Method 3: Use Prisma Studio

```bash
# Connect to production database
npx prisma studio

# Manually create the superadmin user
```

## 🔍 Verify Deployment

### 1. Check Health Endpoint

```bash
curl https://your-backend-domain.vercel.app/health
```

Expected response:

```json
{
  "success": true,
  "message": "Nirapoth Backend is running!",
  "timestamp": "2024-10-18T...",
  "environment": "production",
  "statusCode": 200
}
```

### 2. Check Superadmin Login

```bash
curl -X POST https://your-backend-domain.vercel.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "your-admin@email.com",
    "password": "your-secure-password"
  }'
```

Expected response:

```json
{
  "success": true,
  "message": "Login successful!",
  "data": {
    "user": {
      "id": "...",
      "email": "your-admin@email.com",
      "role": "SUPER_ADMIN",
      ...
    },
    "token": "...",
    "refreshToken": "..."
  }
}
```

## 🚨 Troubleshooting

### Issue: "Superadmin not found"

**Solution:**
Run the seed script manually:

```bash
npm run seed
```

### Issue: "Database connection failed"

**Solution:**

1. Check your `DATABASE_URL` in Vercel environment variables
2. Ensure your database accepts connections from Vercel IPs
3. For Neon/Supabase, make sure connection pooling is enabled

### Issue: "Prisma Client not generated"

**Solution:**
Vercel should run `postinstall` automatically. If not:

```bash
# Locally
npm install
npx prisma generate

# Then redeploy
vercel --prod
```

### Issue: "Seeding runs on every request"

**Solution:**
Make sure `NODE_ENV` is set to `"production"` in Vercel environment variables.

## 📊 Performance Considerations

### Cold Starts

- First request to a serverless function may be slower (cold start)
- Subsequent requests reuse the same instance (warm start)
- Seeding only happens once per function instance

### Database Connections

- Prisma manages connection pooling automatically
- Use connection pooling in your database (e.g., Neon, Supabase)
- Set appropriate connection limits

### Rate Limiting

- Configure rate limits appropriately for production traffic
- Current setting: 6000 requests per minute

## 🎉 Success!

Your Nirapoth Backend is now deployed on Vercel with:

- ✅ Superadmin user created
- ✅ Police hierarchy seeded
- ✅ Default traffic rules loaded
- ✅ Bangladesh geographical data populated
- ✅ API ready to handle requests

## 📚 Additional Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Prisma with Vercel](https://www.prisma.io/docs/guides/deployment/deployment-guides/deploying-to-vercel)
- [Serverless Best Practices](https://vercel.com/docs/concepts/functions/serverless-functions)

## 🔐 Security Checklist

- [ ] Changed default superadmin credentials
- [ ] Set strong `JWT_SECRET` and `JWT_REFRESH_SECRET`
- [ ] Configured proper `CORS_ORIGIN`
- [ ] Enabled database SSL connections
- [ ] Reviewed and removed any debug/seed endpoints
- [ ] Set up proper logging and monitoring
- [ ] Configured rate limiting for production traffic

---

**Need Help?** Contact the development team or check the main README.md
