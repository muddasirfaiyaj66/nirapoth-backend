# Quick Vercel Deployment Steps

## 🚀 Deploy in 3 Steps

### Step 1: Set Environment Variables in Vercel Dashboard

Go to your Vercel project settings → Environment Variables and add:

```env
DATABASE_URL=your-neon-or-supabase-connection-string
JWT_SECRET=your-super-secret-jwt-key
JWT_REFRESH_SECRET=your-super-secret-refresh-key
NODE_ENV=production
CORS_ORIGIN=https://your-frontend.vercel.app

SUPER_ADMIN_EMAIL=your-email@example.com
SUPER_ADMIN_PASSWORD=your-secure-password
SUPER_ADMIN_FIRST_NAME=FirstName
SUPER_ADMIN_LAST_NAME=LastName
SUPER_ADMIN_PHONE=01234567890

EMAIL_SEND_USER_EMAIL=your-email@gmail.com
EMAIL_SEND_USER_PASS=your-app-password
FRONTEND_URL=https://your-frontend.vercel.app
BACKEND_URL=https://your-backend.vercel.app

# Add all other variables from your .env file
```

### Step 2: Deploy

```bash
# If using Vercel CLI
vercel --prod

# Or push to your Git repository connected to Vercel
git push origin main
```

### Step 3: Initialize Database (First Deployment Only)

After deployment, run the seed script:

```bash
# Option A: Run locally with production database
npm run seed

# Option B: Use Prisma Studio
npx prisma studio
# Then manually create the superadmin user
```

## ✅ Verify Deployment

```bash
# Check health
curl https://your-backend.vercel.app/health

# Test superadmin login
curl -X POST https://your-backend.vercel.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "your-email@example.com",
    "password": "your-secure-password"
  }'
```

## 🎯 Important Notes

1. **First deployment**: You MUST run `npm run seed` after the first deployment
2. **NODE_ENV**: Must be set to `"production"` in Vercel
3. **Database**: Use a hosted PostgreSQL (Neon, Supabase, etc.)
4. **Connection Pooling**: Enable it in your database settings

## 🐛 Common Issues

**Issue**: Superadmin not found

- **Solution**: Run `npm run seed` with production DATABASE_URL

**Issue**: Database connection timeout

- **Solution**: Enable connection pooling in your database provider

**Issue**: Build fails on Vercel

- **Solution**: Check that `vercel-build` script runs successfully locally

## 📖 Full Documentation

See [VERCEL_DEPLOYMENT_GUIDE.md](./VERCEL_DEPLOYMENT_GUIDE.md) for comprehensive details.

---

**That's it!** Your backend is now live on Vercel 🎉
