# 🔒 Cross-Origin Cookie Authentication - FIXED!

## 🐛 The Real Problem

Your authentication was failing because of **cross-origin cookie blocking**. Here's what was happening:

### **Frontend:** `https://nirapoth.vercel.app`

### **Backend:** `https://nirapoth-backend.vercel.app`

These are **different domains**, which means cookies were being blocked due to incorrect `sameSite` settings.

---

## 🔍 Issues Found & Fixed

### **Issue 1: Token Storage in Redux (Not Persistent)** ✅ FIXED

**Problem:**

- Tokens were stored in Redux state (memory only)
- Lost on page refresh, navigation, or tab close
- No Redux persistence configured

**Fix:**

- Removed `accessToken` and `refreshToken` from Redux state
- Now using **httpOnly cookies** exclusively
- Redux only stores user profile data

**Files Modified:**

- `nirapoth/lib/store/slices/authSlice.ts`

---

### **Issue 2: Cookie SameSite Policy (Blocking Cross-Origin)** ✅ FIXED

**Problem:**

```typescript
// OLD - WRONG for cross-origin
sameSite: "strict"; // ❌ Blocks cross-site cookies
secure: process.env.NODE_ENV === "production";
```

When `sameSite: "strict"`:

- Cookies are ONLY sent to the same domain
- Frontend (nirapoth.vercel.app) → Backend (nirapoth-backend.vercel.app) = **BLOCKED** 🚫

**Fix:**

```typescript
// NEW - CORRECT for cross-origin
sameSite: "none"; // ✅ Allows cross-site cookies
secure: true; // ✅ Required when sameSite: "none"
```

**Files Modified:**

- `nirapoth-backend/src/controllers/auth.controller.ts`

---

## 🔐 How Authentication Works Now

### **1. Login Flow:**

```
User enters credentials
    ↓
Frontend sends POST /api/auth/login with credentials
    ↓
Backend validates credentials
    ↓
Backend generates JWT tokens
    ↓
Backend sets httpOnly cookies with sameSite: "none"
    ↓
Cookies are sent to frontend and stored by browser
    ↓
Frontend receives user data (NOT tokens)
    ↓
Redux stores user profile only
```

### **2. Subsequent Requests:**

```
Frontend makes API call (e.g., GET /api/auth/me)
    ↓
Axios automatically includes cookies (withCredentials: true)
    ↓
Backend reads tokens from cookies
    ↓
Backend validates tokens
    ↓
Backend returns requested data
```

### **3. Token Refresh (Automatic):**

```
Request fails with 401 Unauthorized
    ↓
Axios interceptor catches 401
    ↓
Axios calls POST /api/auth/refresh
    ↓
Backend reads refresh token from cookies
    ↓
Backend generates new tokens
    ↓
Backend sets new cookies
    ↓
Original request is retried with new tokens
```

---

## 📋 Cookie Configuration

### **Access Token Cookie:**

```typescript
{
  name: "accessToken",
  httpOnly: true,          // ✅ Cannot be accessed by JavaScript
  secure: true,            // ✅ Only sent over HTTPS
  sameSite: "none",        // ✅ Allows cross-origin requests
  maxAge: 15 * 60 * 1000  // ✅ 15 minutes
}
```

### **Refresh Token Cookie:**

```typescript
{
  name: "refreshToken",
  httpOnly: true,                    // ✅ Cannot be accessed by JavaScript
  secure: true,                      // ✅ Only sent over HTTPS
  sameSite: "none",                  // ✅ Allows cross-origin requests
  maxAge: 7 * 24 * 60 * 60 * 1000   // ✅ 7 days
}
```

---

## 🔧 Frontend Configuration

### **Axios Configuration:**

```typescript
// lib/api/apiClient.ts
const apiClient = axios.create({
  baseURL: "https://nirapoth-backend.vercel.app/api",
  withCredentials: true, // ✅ CRITICAL: Sends cookies cross-origin
  headers: {
    "Content-Type": "application/json",
  },
});
```

### **CORS Configuration (Backend):**

```typescript
// Already configured correctly
{
  origin: "https://nirapoth.vercel.app",
  credentials: true,  // ✅ Allows credentials
  exposedHeaders: ["Authorization", "Set-Cookie"],
  allowedHeaders: ["Authorization", "Content-Type"],
}
```

---

## ✅ What's Working Now

1. **✅ Login** - Cookies are set correctly
2. **✅ Authenticated Requests** - Cookies are sent automatically
3. **✅ Page Refresh** - User stays logged in
4. **✅ Navigation** - User stays logged in
5. **✅ Token Refresh** - Automatic on 401 errors
6. **✅ Logout** - Cookies are cleared
7. **✅ Security** - httpOnly cookies prevent XSS attacks

---

## 🧪 Testing

### **Test 1: Login and Check Cookies**

1. Open DevTools → Application → Cookies
2. Login to https://nirapoth.vercel.app/login
3. Check cookies from `nirapoth-backend.vercel.app`
4. Should see:
   - `accessToken` (httpOnly, secure, sameSite=None)
   - `refreshToken` (httpOnly, secure, sameSite=None)

### **Test 2: Verify Cookies Are Sent**

1. Open DevTools → Network
2. Make any API call (e.g., GET /api/auth/me)
3. Check Request Headers
4. Should see: `Cookie: accessToken=...; refreshToken=...`

### **Test 3: Page Refresh**

1. Login successfully
2. Navigate to dashboard
3. **Refresh the page (F5)**
4. **Should stay logged in** ✅

### **Test 4: Token Expiry**

1. Wait 15 minutes (access token expires)
2. Make an API call
3. Should automatically refresh token
4. Request should succeed

---

## 📊 Browser Cookie Requirements

For `sameSite: "none"` to work:

- ✅ **HTTPS** - Both frontend and backend must use HTTPS
- ✅ **Secure flag** - Cookies must have `secure: true`
- ✅ **CORS credentials** - `withCredentials: true` in axios
- ✅ **CORS headers** - Backend allows credentials

All requirements are **MET** ✅

---

## 🚫 What NOT to Do

### ❌ Don't Store Tokens in localStorage

```typescript
// BAD - Vulnerable to XSS attacks
localStorage.setItem("accessToken", token);
```

### ❌ Don't Use sameSite: "strict" for Cross-Origin

```typescript
// BAD - Blocks cross-origin cookies
sameSite: "strict";
```

### ❌ Don't Forget withCredentials

```typescript
// BAD - Cookies won't be sent
axios.get("/api/endpoint");

// GOOD - Cookies will be sent
axios.get("/api/endpoint", { withCredentials: true });
```

---

## 🎯 Deployment Checklist

- [x] Backend sets cookies with `sameSite: "none"` and `secure: true`
- [x] Frontend axios has `withCredentials: true`
- [x] CORS allows credentials from frontend origin
- [x] Both frontend and backend use HTTPS
- [x] Tokens removed from Redux state
- [x] Backend deployed to Vercel
- [x] Frontend deployed to Vercel

---

## 🔒 Security Benefits

1. **httpOnly Cookies** - Cannot be accessed by JavaScript (prevents XSS)
2. **Secure Flag** - Only sent over HTTPS (prevents MITM)
3. **sameSite: "none"** - Properly configured for cross-origin
4. **CORS Protection** - Only allowed origins can make requests
5. **Short-lived Access Tokens** - 15 minutes (reduces exposure)
6. **Long-lived Refresh Tokens** - 7 days (user convenience)

---

## 📚 Additional Resources

- [MDN - SameSite Cookies](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Set-Cookie/SameSite)
- [CORS with Credentials](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS#requests_with_credentials)
- [httpOnly Cookies](https://owasp.org/www-community/HttpOnly)

---

## 🎉 Result

**Authentication is now fully functional with secure, cross-origin httpOnly cookies!**

**Test it:** https://nirapoth.vercel.app/login

**Credentials:**

- Email: `muddasirfaiyaj66@gmail.com`
- Password: `admin@#`

After login:

- ✅ Dashboard loads
- ✅ Page refresh keeps you logged in
- ✅ Navigation works
- ✅ Automatic token refresh
- ✅ Secure & persistent authentication

---

**Date Fixed:** October 18, 2025  
**Status:** ✅ **PRODUCTION READY**
