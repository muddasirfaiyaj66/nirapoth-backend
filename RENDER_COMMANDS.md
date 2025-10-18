# 🎯 Render Web Service - Exact Commands

## Configuration for GitHub Setup

### **1. Basic Information**

```
Name:              nirapoth-backend
Region:            Singapore
Branch:            main
Root Directory:    nirapoth-backend
```

### **2. Build & Deploy**

```
Runtime:           Node
Build Command:     npm install && npx prisma generate && npm run build
Start Command:     npm start
```

### **3. Advanced Settings**

```
Plan:              Free
Health Check Path: /health
Auto-Deploy:       Yes (enabled)
```

---

## 📋 Step-by-Step Process

### **Step 1: New Web Service**

1. Go to [https://dashboard.render.com](https://dashboard.render.com)
2. Click **"New +"** button (top right)
3. Select **"Web Service"**

### **Step 2: Connect GitHub Repository**

1. If first time: Click **"Connect GitHub"**
2. Authorize Render to access your repos
3. Find your repository in the list
4. Click **"Connect"** next to `Nirapoth_web` (or your repo name)

### **Step 3: Configure Service**

**Repository & Branch:**

- **Repository:** `Nirapoth_web`
- **Branch:** `main` (or `master`)

**Name & Region:**

- **Name:** `nirapoth-backend`
- **Region:** **Singapore** (or closest)

**Root Directory:**

```
nirapoth-backend
```

_(Only needed if your repo has multiple folders)_

**Runtime:**

- Select **Node** from dropdown

**Build Command:**

```bash
npm install && npx prisma generate && npm run build
```

**Start Command:**

```bash
npm start
```

**Plan:**

- Select **Free** from dropdown

---

### **Step 4: Advanced Settings**

Click **"Advanced"** button to expand

**Health Check:**

- **Health Check Path:** `/health`

**Environment Variables:**
Click **"Add Environment Variable"** for each:

```env
NODE_ENV=production
PORT=10000
DATABASE_URL=postgresql://user:password@host/dbname
JWT_SECRET=your_jwt_secret_here
JWT_REFRESH_SECRET=your_refresh_secret_here
FRONTEND_URL=https://nirapoth.vercel.app
CORS_ORIGIN=https://nirapoth.vercel.app

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloudinary_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# SSLCommerz
SSLCOMMERZ_STORE_ID=your_store_id
SSLCOMMERZ_STORE_PASSWORD=your_store_password
SSLCOMMERZ_IS_LIVE=false
```

**Auto-Deploy:**

- ✅ Enabled (checkbox checked)

---

### **Step 5: Create Web Service**

Click **"Create Web Service"** button at the bottom

---

## ⏱️ Deployment Timeline

```
00:00 - Creating service...
00:30 - Cloning repository...
01:00 - Installing dependencies (npm install)...
03:00 - Generating Prisma Client...
04:00 - Building TypeScript...
05:00 - Starting server...
05:30 - Running health checks...
06:00 - ✅ Live!
```

---

## 🔍 What Each Command Does

### **Build Command:**

```bash
npm install && npx prisma generate && npm run build
```

**Breakdown:**

1. **`npm install`**

   - Reads `package.json`
   - Downloads all dependencies to `node_modules/`
   - Takes ~2-3 minutes

2. **`npx prisma generate`**

   - Generates Prisma Client based on `prisma/schema.prisma`
   - Creates TypeScript types for your database
   - Takes ~30 seconds

3. **`npm run build`**
   - Runs the `build` script from `package.json`
   - Compiles TypeScript (`src/*.ts`) to JavaScript (`dist/*.js`)
   - Takes ~1 minute

### **Start Command:**

```bash
npm start
```

**What it does:**

- Runs the `start` script from `package.json`
- In your case: `node dist/index.js`
- Starts your Express server
- Initializes Socket.IO
- Runs database seeding

---

## ✅ Verification

After deployment, check the **Logs** tab for:

```
✅ Database connection established
🌱 Starting database initialization...
✅ Super admin created/verified
✅ Database initialization completed successfully!
🚀 Nirapoth Backend Server is running!
🔌 Socket.IO: Ready for real-time connections
Your service is live at https://nirapoth-backend.onrender.com
```

---

## 🧪 Test Your Deployment

```bash
# Test health endpoint
curl https://nirapoth-backend.onrender.com/health

# Expected response:
# {"success":true,"message":"Nirapoth Backend is running!","statusCode":200}
```

---

## 🚨 Common Issues

### **Issue: Build fails at `npm install`**

**Solution:** Check `package.json` is committed to GitHub

### **Issue: Build fails at `prisma generate`**

**Solution:**

- Ensure `prisma/schema.prisma` is in your repo
- Check `DATABASE_URL` env var is set

### **Issue: Build fails at `npm run build`**

**Solution:**

- Make sure `build` script exists in `package.json`
- Should be: `"build": "pnpm exec prisma generate && pnpm exec tsc --project tsconfig.json"`

### **Issue: Server starts but crashes**

**Solution:**

- Check logs for errors
- Verify all environment variables are set
- Make sure `PORT` is set to `10000`

### **Issue: Health check fails**

**Solution:**

- Verify health endpoint exists at `/health`
- Check server is listening on correct PORT
- Make sure route returns 200 status

---

## 📌 Important Notes

1. **Root Directory:**

   - Only needed if your backend is in a subfolder
   - If your `package.json` is at repo root, leave empty
   - If it's in `nirapoth-backend/`, enter `nirapoth-backend`

2. **Build Command:**

   - Must complete successfully before Start Command runs
   - If build fails, deployment stops
   - Check logs for errors

3. **Start Command:**

   - Must keep running (don't exit)
   - If process exits, service shows as "Failed"
   - Your Express server should listen indefinitely

4. **Environment Variables:**

   - Don't use quotes around values
   - ✅ `JWT_SECRET=abc123`
   - ❌ `JWT_SECRET="abc123"`

5. **Database URL:**
   - Use **Internal Database URL** from Render PostgreSQL
   - Format: `postgresql://user:password@host/database`
   - Copy from Database → Info tab

---

## 🎯 Quick Copy-Paste

**For Render Web Service form:**

```
Name:              nirapoth-backend
Region:            Singapore
Branch:            main
Root Directory:    nirapoth-backend
Runtime:           Node
Build Command:     npm install && npx prisma generate && npm run build
Start Command:     npm start
Plan:              Free
Health Check:      /health
```

---

**Need help?** Let me know which step you're on! 🚀
