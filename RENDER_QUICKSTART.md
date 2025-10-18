# 🚀 Quick Start: Deploy to Render

## ✅ Ready to Deploy!

All files are prepared. Follow these steps:

---

## Step 1: Sign Up for Render

1. Go to **[https://render.com](https://render.com)**
2. Click **"Get Started"**
3. Sign up with **GitHub** (easiest)
4. Authorize Render to access your repositories

---

## Step 2: Create PostgreSQL Database

1. In Render Dashboard, click **"New +"** → **"PostgreSQL"**

2. Fill in:

   - **Name:** `nirapoth-db`
   - **Database:** `nirapoth`
   - **User:** `nirapoth_user`
   - **Region:** **Singapore** (or closest to you)
   - **PostgreSQL Version:** 16
   - **Plan:** **Free**

3. Click **"Create Database"**

4. Wait 2-3 minutes

5. Once ready, go to **"Info"** tab

6. Copy **"Internal Database URL"** (looks like):
   ```
   postgresql://nirapoth_user:xxx@xxx.oregon-postgres.render.com/nirapoth
   ```

---

## Step 3: Create Web Service

1. Click **"New +"** → **"Web Service"**

2. Connect Repository:

   - Select your GitHub repo
   - If not listed, click **"Configure account"** and grant access

3. Fill in **Basic Settings:**

   ```
   Name:              nirapoth-backend
   Region:            Singapore (same as database)
   Branch:            main
   Root Directory:    nirapoth-backend (if monorepo, otherwise leave empty)
   Runtime:           Node
   Build Command:     npm install && npx prisma generate && npm run build
   Start Command:     npm start
   ```

4. **Plan:** Select **Free**

5. Click **"Advanced"** button

6. Add **Environment Variables** (click **"Add Environment Variable"** for each):

   ```env
   NODE_ENV=production
   PORT=10000
   DATABASE_URL=<paste_internal_database_url_from_step2>

   # JWT Secrets (generate new ones or use existing)
   JWT_SECRET=your_super_secret_jwt_key_min_32_chars
   JWT_REFRESH_SECRET=your_super_secret_refresh_key_min_32_chars

   # Frontend URL
   FRONTEND_URL=https://nirapoth.vercel.app
   CORS_ORIGIN=https://nirapoth.vercel.app

   # Cloudinary (for file uploads)
   CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
   CLOUDINARY_API_KEY=your_cloudinary_api_key
   CLOUDINARY_API_SECRET=your_cloudinary_api_secret

   # SSLCommerz (for payments)
   SSLCOMMERZ_STORE_ID=your_store_id
   SSLCOMMERZ_STORE_PASSWORD=your_store_password
   SSLCOMMERZ_IS_LIVE=false

   # Add any other env vars from your .env file
   ```

   **Important:** Don't include quotes around values!

   ✅ Good: `JWT_SECRET=my_secret_key_12345`  
   ❌ Bad: `JWT_SECRET="my_secret_key_12345"`

7. **Health Check Path:** `/health`

8. **Auto-Deploy:** Yes (enabled by default)

9. Click **"Create Web Service"**

---

## Step 4: Wait for Deployment

1. Render will now:

   - ⏳ Install dependencies (2-3 minutes)
   - ⏳ Generate Prisma client (1 minute)
   - ⏳ Build TypeScript (1 minute)
   - ⏳ Start server (30 seconds)

2. Watch the **"Logs"** tab

3. Look for these success messages:

   ```
   ✅ Database connection established
   🌱 Starting database initialization...
   ✅ Super admin created/verified
   ✅ Database initialization completed successfully!
   🚀 Nirapoth Backend Server is running!
   🔌 Socket.IO: Ready for real-time connections
   ```

4. If successful, status will show **"Live"** (green)

5. Your backend URL will be:
   ```
   https://nirapoth-backend.onrender.com
   ```

---

## Step 5: Test Backend

```bash
# Test health endpoint
curl https://nirapoth-backend.onrender.com/health

# Should return:
# {"success":true,"message":"Nirapoth Backend is running!","statusCode":200}
```

---

## Step 6: Update Frontend Environment Variables

Update `nirapoth/.env.local`:

```env
# Change from Vercel backend to Render backend
NEXT_PUBLIC_API_BASE_URL=https://nirapoth-backend.onrender.com/api
NEXT_PUBLIC_BACKEND_URL=https://nirapoth-backend.onrender.com
```

---

## Step 7: Update Frontend in Vercel

1. **Option A: Via Vercel Dashboard**

   - Go to [vercel.com/dashboard](https://vercel.com/dashboard)
   - Select `nirapoth` project
   - Go to **Settings** → **Environment Variables**
   - Update:
     - `NEXT_PUBLIC_API_BASE_URL` = `https://nirapoth-backend.onrender.com/api`
     - `NEXT_PUBLIC_BACKEND_URL` = `https://nirapoth-backend.onrender.com`
   - Go to **Deployments** → Click **"..."** on latest → **"Redeploy"**

2. **Option B: Via CLI**
   ```bash
   cd nirapoth
   npm run build
   vercel --prod
   ```

---

## Step 8: Test Everything!

### 1. Test Login

```
https://nirapoth.vercel.app/login
```

Login with: `muddasirfaiyaj66@gmail.com` / `admin@#`

### 2. Check Browser Console

Should see:

```
✅ Socket connected: <socket-id>
✅ Socket authenticated: { userId: "...", role: "..." }
```

### 3. Test Real-Time Notifications

- Stay logged in
- Check notifications
- Should receive real-time updates! 🎉

---

## 🎉 Done!

Your full stack is now deployed:

```
┌─────────────────────────────────┐
│         FRONTEND (Vercel)       │
│   https://nirapoth.vercel.app   │
└────────────┬────────────────────┘
             │ HTTP + WebSocket
             ▼
┌─────────────────────────────────┐
│         BACKEND (Render)        │
│ https://nirapoth-backend       │
│           .onrender.com         │
│    (Express + Socket.IO)        │
└────────────┬────────────────────┘
             │ PostgreSQL
             ▼
┌─────────────────────────────────┐
│      DATABASE (Render)          │
│       PostgreSQL Free           │
└─────────────────────────────────┘
```

---

## 🔧 Troubleshooting

### Backend won't start

- Check **"Logs"** tab in Render
- Look for errors
- Common issues:
  - Missing environment variables
  - Wrong `DATABASE_URL`
  - Wrong `Build Command` or `Start Command`

### Database connection failed

- Make sure you used **"Internal Database URL"** (not External)
- Format: `postgresql://user:pass@host/dbname`
- Check database is in same region as backend

### Frontend can't connect

- Make sure environment variables are updated in Vercel
- Hard refresh browser: `Ctrl+Shift+R`
- Check Network tab for correct backend URL

### Socket.IO not working

- Check browser console for errors
- Make sure `NEXT_PUBLIC_BACKEND_URL` doesn't have `/api` at the end
- Should be: `https://nirapoth-backend.onrender.com` (no trailing slash)

---

## 💡 Tips

### Auto-Deploy on Git Push

Render automatically deploys when you push to GitHub:

```bash
git add .
git commit -m "Update backend"
git push origin main
# Render auto-deploys in ~5 min
```

### View Real-Time Logs

Dashboard → nirapoth-backend → **"Logs"** tab

### Manual Redeploy

Dashboard → nirapoth-backend → **"Manual Deploy"** → **"Deploy latest commit"**

### Free Tier Limitations

- **Spins down after 15 min of inactivity**
- First request after spin-down takes ~30-60 seconds (cold start)
- Solution: Upgrade to **$7/month** for 24/7 uptime

### Keep Free Service Awake

Use a service like [UptimeRobot](https://uptimerobot.com/) to ping your backend every 10 minutes:

- URL to ping: `https://nirapoth-backend.onrender.com/health`
- Interval: 10 minutes
- Keeps service warm (no cold starts)

---

## 📞 Need Help?

- **Render Docs:** https://render.com/docs
- **Render Status:** https://status.render.com
- **Community:** https://community.render.com

---

**Ready? Start with Step 1!** 🚀
