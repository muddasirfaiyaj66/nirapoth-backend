# 🚀 Deploy to Render - Complete Guide

## Why Render?

✅ **WebSocket Support** - Socket.IO works perfectly  
✅ **Free Tier** - 750 hours/month (enough for 1 service running 24/7)  
✅ **Auto-deploy** - Connects to GitHub, auto-deploys on push  
✅ **Simple Setup** - Much easier than VPS  
✅ **PostgreSQL Support** - Free PostgreSQL database included

---

## 📋 Pre-Deployment Checklist

### **1. Prepare Backend for Render**

Create `render.yaml` in `nirapoth-backend/`:

```yaml
services:
  - type: web
    name: nirapoth-backend
    env: node
    region: singapore
    plan: free
    buildCommand: npm install && npx prisma generate && npm run build
    startCommand: npm start
    envVars:
      - key: NODE_ENV
        value: production
      - key: DATABASE_URL
        fromDatabase:
          name: nirapoth-db
          property: connectionString
      - key: PORT
        value: 10000
    healthCheckPath: /health

databases:
  - name: nirapoth-db
    databaseName: nirapoth
    user: nirapoth_user
    plan: free
```

### **2. Update package.json**

Ensure you have a `start` script:

```json
{
  "scripts": {
    "start": "node dist/index.js",
    "build": "pnpm exec prisma generate && pnpm exec tsc --project tsconfig.json",
    "dev": "nodemon --exec ts-node src/index.ts"
  }
}
```

### **3. Update Environment Detection**

Since we're moving away from Vercel, update `nirapoth-backend/src/index.ts`:

```typescript
// Remove Vercel-specific checks
// Enable Socket.IO for all production environments
initializeSocket(httpServer);

// Always start the HTTP server (Render needs this)
httpServer.listen(PORT, async () => {
  console.log(`🚀 Nirapoth Backend Server is running!`);
  console.log(`📍 Environment: ${config.nodeEnv}`);
  console.log(`🌐 Server: http://localhost:${PORT}`);
  console.log(`🔌 Socket.IO: Ready for real-time connections`);

  // Run seeding in production on first startup
  if (config.nodeEnv === "production") {
    console.log("\n" + "=".repeat(50));
    await SeedService.runStartupSeeding();
    console.log("=".repeat(50) + "\n");
  }
});
```

---

## 🎯 Step-by-Step Deployment

### **Step 1: Sign Up for Render**

1. Go to [https://render.com](https://render.com)
2. Sign up with GitHub (easiest option)
3. Authorize Render to access your repositories

---

### **Step 2: Create PostgreSQL Database**

1. Click **"New +"** → **"PostgreSQL"**
2. Configure:
   - **Name:** `nirapoth-db`
   - **Database:** `nirapoth`
   - **User:** `nirapoth_user`
   - **Region:** Singapore (or closest to you)
   - **Plan:** **Free**
3. Click **"Create Database"**
4. Wait 2-3 minutes for database to be ready
5. Copy the **"Internal Database URL"** (we'll use this)

---

### **Step 3: Create Web Service**

1. Click **"New +"** → **"Web Service"**
2. Connect your GitHub repository: `Nirapoth_web/nirapoth-backend`
3. Configure:

   **Basic:**

   - **Name:** `nirapoth-backend`
   - **Region:** Singapore (same as database)
   - **Branch:** `main`
   - **Root Directory:** `nirapoth-backend` (if monorepo)
   - **Runtime:** Node
   - **Build Command:** `npm install && npx prisma generate && npm run build`
   - **Start Command:** `npm start`

   **Advanced:**

   - **Plan:** Free
   - **Health Check Path:** `/health`

4. Click **"Advanced"** → **"Add Environment Variable"**

   Add these variables:

   ```env
   NODE_ENV=production
   PORT=10000
   DATABASE_URL=<paste_internal_database_url_here>
   JWT_SECRET=<your_jwt_secret>
   JWT_REFRESH_SECRET=<your_refresh_secret>
   FRONTEND_URL=https://nirapoth.vercel.app
   CORS_ORIGIN=https://nirapoth.vercel.app

   # Add all other env vars from your .env file
   CLOUDINARY_CLOUD_NAME=<your_value>
   CLOUDINARY_API_KEY=<your_value>
   CLOUDINARY_API_SECRET=<your_value>
   SSLCOMMERZ_STORE_ID=<your_value>
   SSLCOMMERZ_STORE_PASSWORD=<your_value>
   # ... etc
   ```

5. Click **"Create Web Service"**

---

### **Step 4: Wait for Deployment**

1. Render will:

   - Install dependencies (~2-3 min)
   - Generate Prisma client (~1 min)
   - Build TypeScript (~1 min)
   - Run migrations
   - Start server

2. Watch the logs for:

   ```
   ✅ Database connection established
   🌱 Starting database initialization...
   ✅ Database initialization completed successfully!
   🚀 Nirapoth Backend Server is running!
   🔌 Socket.IO: Ready for real-time connections
   ```

3. Your backend will be live at:
   ```
   https://nirapoth-backend.onrender.com
   ```

---

### **Step 5: Update Frontend Environment Variables**

Update `nirapoth/.env.local`:

```env
# Old Vercel backend
# NEXT_PUBLIC_API_BASE_URL=https://nirapoth-backend.vercel.app/api
# NEXT_PUBLIC_BACKEND_URL=https://nirapoth-backend.vercel.app

# New Render backend
NEXT_PUBLIC_API_BASE_URL=https://nirapoth-backend.onrender.com/api
NEXT_PUBLIC_BACKEND_URL=https://nirapoth-backend.onrender.com
```

---

### **Step 6: Re-enable Socket.IO in Frontend**

Update `nirapoth/lib/socket/socketClient.ts`:

```typescript
export function initializeSocket(userId: string, role: string): Socket {
  if (socket && socket.connected) {
    return socket;
  }

  // Remove Vercel check since we're on Render now
  // Socket.IO works on Render!

  socket = io(SOCKET_URL, {
    transports: ["websocket", "polling"],
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionAttempts: 5,
    timeout: 10000,
  });

  socket.on("connect", () => {
    console.log("✅ Socket connected:", socket?.id);
    socket?.emit("authenticate", { userId, role });
  });

  // ... rest of the code
}
```

---

### **Step 7: Deploy Frontend to Vercel**

```bash
cd nirapoth
npm run build
vercel --prod
```

---

### **Step 8: Update Backend CORS**

Make sure backend allows Render domain in CORS:

`nirapoth-backend/src/middlewares/security.middleware.ts`:

```typescript
const allowedOrigins = [
  config.cors.origin,
  process.env.FRONTEND_URL,
  "http://localhost:3000",
  "https://nirapoth.vercel.app",
  "https://nirapoth-web.vercel.app",
  // Add Render backend for CORS (if needed)
  "https://nirapoth-backend.onrender.com",
].filter(Boolean) as string[];
```

---

## 🧪 Testing

### **1. Test Backend Health**

```bash
curl https://nirapoth-backend.onrender.com/health
```

Expected:

```json
{
  "success": true,
  "message": "Nirapoth Backend is running!",
  "statusCode": 200
}
```

### **2. Test Socket.IO**

1. Go to https://nirapoth.vercel.app/login
2. Open browser console
3. Login
4. Check for:
   ```
   ✅ Socket connected: <socket-id>
   ✅ Socket authenticated
   ```

### **3. Test API**

```bash
curl https://nirapoth-backend.onrender.com/api/auth/health
```

---

## ⚙️ Render Configuration Tips

### **Auto-Deploy on Git Push**

Render automatically deploys when you push to GitHub:

```bash
git add .
git commit -m "Update backend"
git push origin main
# Render will auto-deploy in ~5 minutes
```

### **View Logs**

- Dashboard → Your Service → **"Logs"** tab
- Real-time streaming logs
- Filter by severity (info, error, etc.)

### **Custom Domain (Optional)**

1. Go to Service → **"Settings"** → **"Custom Domain"**
2. Add: `api.nirapoth.com`
3. Update DNS:
   ```
   CNAME api.nirapoth.com → nirapoth-backend.onrender.com
   ```

### **Environment Variables**

- Dashboard → Your Service → **"Environment"** tab
- Add/edit variables
- Auto-redeploys on change

### **Manual Deploy**

- Dashboard → Your Service → **"Manual Deploy"** → **"Deploy latest commit"**

---

## 💰 Render Free Tier Limits

| Resource          | Limit                      |
| ----------------- | -------------------------- |
| **Hours/Month**   | 750 hours (1 service 24/7) |
| **RAM**           | 512 MB                     |
| **CPU**           | Shared                     |
| **Bandwidth**     | 100 GB/month               |
| **Build Minutes** | Unlimited                  |
| **Services**      | Unlimited                  |

**Important:** Free services **spin down after 15 minutes of inactivity**

- First request after spin-down takes ~30 seconds
- Can upgrade to paid ($7/month) for 24/7 uptime

---

## 🚀 Upgrade Path

### **Paid Plan ($7/month per service)**

- 24/7 uptime (no spin-down)
- More RAM (512 MB → 2 GB)
- Priority support
- Custom domains
- Better performance

---

## 🎉 Benefits of Render Over Vercel

| Feature                  | Vercel (Serverless)          | Render (Traditional Server) |
| ------------------------ | ---------------------------- | --------------------------- |
| **Socket.IO**            | ❌ No                        | ✅ Yes                      |
| **WebSockets**           | ❌ No                        | ✅ Yes                      |
| **Long-running tasks**   | ❌ No (30s timeout)          | ✅ Yes                      |
| **In-memory state**      | ❌ No                        | ✅ Yes                      |
| **Cron jobs**            | ❌ Limited                   | ✅ Full support             |
| **Database connections** | ⚠️ Connection pooling needed | ✅ Direct connections       |
| **Cost**                 | Free                         | Free (with limits)          |

---

## 📞 Quick Commands

```bash
# Check backend health
curl https://nirapoth-backend.onrender.com/health

# Check API
curl https://nirapoth-backend.onrender.com/api/auth/me

# View logs (in Render dashboard)
Dashboard → nirapoth-backend → Logs

# Trigger manual deploy
Dashboard → nirapoth-backend → Manual Deploy

# Check database
Dashboard → nirapoth-db → Connect → Use connection string
```

---

## 🎯 Final Architecture

```
┌─────────────────────────────────────────────────┐
│                   FRONTEND                      │
│         https://nirapoth.vercel.app             │
│              (Next.js on Vercel)                │
└────────────────┬────────────────────────────────┘
                 │
                 │ HTTP/REST API
                 │ WebSocket (Socket.IO)
                 ▼
┌─────────────────────────────────────────────────┐
│                   BACKEND                       │
│    https://nirapoth-backend.onrender.com       │
│         (Express + Socket.IO on Render)         │
└────────────────┬────────────────────────────────┘
                 │
                 │ PostgreSQL
                 ▼
┌─────────────────────────────────────────────────┐
│                  DATABASE                       │
│              (PostgreSQL on Render)             │
└─────────────────────────────────────────────────┘
```

---

## ✅ Checklist

Before deploying:

- [ ] Create `render.yaml` in backend
- [ ] Update `package.json` with `start` script
- [ ] Remove Vercel-specific code from `index.ts`
- [ ] Commit and push to GitHub
- [ ] Create Render account
- [ ] Create PostgreSQL database on Render
- [ ] Create Web Service on Render
- [ ] Add all environment variables
- [ ] Wait for deployment
- [ ] Update frontend `.env.local`
- [ ] Re-enable Socket.IO in frontend
- [ ] Deploy frontend to Vercel
- [ ] Test everything

---

**Ready to deploy?** Let me know and I'll help you with each step! 🚀
