# Frontend Token Storage Issue - Fix Guide

## 🐛 Problem

After successful login (200 response), subsequent API calls return 401 (Unauthorized), causing automatic logout.

## 🔍 Root Cause

The frontend is not properly storing or sending the JWT token with subsequent API requests.

## ✅ Backend Fix (Already Applied)

- Updated CORS configuration to expose `Authorization` header
- Added `exposedHeaders` for token access
- Enabled `credentials: true` for cookie support
- Added Vercel preview URL support

## 🔧 Frontend Fix Required

### **Step 1: Check Token Storage**

After successful login, the backend returns:

```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1...",
    "refreshToken": "eyJhbGciOiJIUzI1..."
  }
}
```

**You MUST store these tokens in localStorage or cookies:**

```typescript
// In your login handler (Next.js example)
const handleLogin = async (email: string, password: string) => {
  try {
    const response = await fetch(`${API_URL}/api/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
      credentials: "include", // Important for cookies
    });

    const data = await response.json();

    if (data.success) {
      // Store tokens in localStorage
      localStorage.setItem("accessToken", data.data.accessToken);
      localStorage.setItem("refreshToken", data.data.refreshToken);

      // Or store in cookies (more secure)
      document.cookie = `accessToken=${data.data.accessToken}; path=/; secure; samesite=strict`;

      // Redirect or update state
      router.push("/dashboard");
    }
  } catch (error) {
    console.error("Login failed:", error);
  }
};
```

### **Step 2: Send Token with Every Request**

Create an axios instance or fetch wrapper:

#### **Option A: Using Axios**

```typescript
// lib/axios.ts
import axios from "axios";

const axiosInstance = axios.create({
  baseURL:
    process.env.NEXT_PUBLIC_API_URL || "https://nirapoth-backend.vercel.app",
  withCredentials: true, // Important for cookies
});

// Request interceptor - Add token to every request
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("accessToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Handle 401 errors
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If 401 and not already retried
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Try to refresh the token
        const refreshToken = localStorage.getItem("refreshToken");
        const response = await axios.post(
          `${process.env.NEXT_PUBLIC_API_URL}/api/auth/refresh`,
          { refreshToken },
          { withCredentials: true }
        );

        if (response.data.success) {
          const { accessToken } = response.data.data;
          localStorage.setItem("accessToken", accessToken);

          // Retry the original request with new token
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return axiosInstance(originalRequest);
        }
      } catch (refreshError) {
        // Refresh failed - logout user
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        window.location.href = "/login";
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
```

**Then use it in your components:**

```typescript
import axiosInstance from "@/lib/axios";

// Get user profile
const getProfile = async () => {
  try {
    const response = await axiosInstance.get("/api/auth/me");
    console.log("User:", response.data);
  } catch (error) {
    console.error("Failed to get profile:", error);
  }
};
```

#### **Option B: Using Fetch**

```typescript
// lib/fetch.ts
export const apiRequest = async (
  endpoint: string,
  options: RequestInit = {}
) => {
  const token = localStorage.getItem("accessToken");

  const config: RequestInit = {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
    credentials: "include", // Important!
  };

  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}${endpoint}`,
    config
  );

  if (response.status === 401) {
    // Try to refresh token
    const refreshToken = localStorage.getItem("refreshToken");
    if (refreshToken) {
      try {
        const refreshResponse = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/auth/refresh`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ refreshToken }),
            credentials: "include",
          }
        );

        const refreshData = await refreshResponse.json();
        if (refreshData.success) {
          localStorage.setItem("accessToken", refreshData.data.accessToken);

          // Retry original request
          return apiRequest(endpoint, options);
        }
      } catch (refreshError) {
        // Logout user
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        window.location.href = "/login";
        throw refreshError;
      }
    }

    // No refresh token - logout
    window.location.href = "/login";
  }

  return response.json();
};
```

### **Step 3: Update Environment Variables**

Make sure your frontend `.env` file has:

```env
NEXT_PUBLIC_API_URL=https://nirapoth-backend.vercel.app
```

### **Step 4: Check Authentication Context**

If using React Context for auth:

```typescript
// context/AuthContext.tsx
import { createContext, useContext, useEffect, useState } from "react";
import axiosInstance from "@/lib/axios";

interface AuthContextType {
  user: any;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check if user is logged in on mount
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem("accessToken");
      if (token) {
        try {
          const response = await axiosInstance.get("/api/auth/me");
          setUser(response.data.data);
        } catch (error) {
          console.error("Auth check failed:", error);
          localStorage.removeItem("accessToken");
          localStorage.removeItem("refreshToken");
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await axiosInstance.post("/api/auth/login", {
        email,
        password,
      });

      if (response.data.success) {
        const { accessToken, refreshToken, user } = response.data.data;
        localStorage.setItem("accessToken", accessToken);
        localStorage.setItem("refreshToken", refreshToken);
        setUser(user);
      }
    } catch (error) {
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    setUser(null);
    window.location.href = "/login";
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};
```

## 🧪 Testing

1. **Login and check localStorage:**

```javascript
// In browser console after login
console.log("Access Token:", localStorage.getItem("accessToken"));
console.log("Refresh Token:", localStorage.getItem("refreshToken"));
```

2. **Test API call with token:**

```javascript
// In browser console
fetch("https://nirapoth-backend.vercel.app/api/auth/me", {
  headers: {
    Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
  },
  credentials: "include",
})
  .then((res) => res.json())
  .then((data) => console.log("User:", data));
```

3. **Check Network Tab:**
   - Open DevTools → Network
   - Login and make API calls
   - Check if `Authorization: Bearer ...` header is present in requests
   - Check if responses include tokens

## 📝 Common Issues

### Issue 1: Token not being sent

**Solution:** Make sure `Authorization` header is added to every request

### Issue 2: CORS error

**Solution:** Ensure `credentials: 'include'` is set in fetch/axios requests

### Issue 3: Token expires too quickly

**Solution:** Implement token refresh logic (already in examples above)

### Issue 4: Token stored but still 401

**Solution:** Check token format - must be `Bearer <token>`, not just `<token>`

## ✅ Checklist

- [ ] Tokens are stored after successful login
- [ ] Tokens are retrieved from storage before API calls
- [ ] `Authorization: Bearer <token>` header is set
- [ ] `credentials: 'include'` is set in requests
- [ ] Token refresh logic is implemented
- [ ] Logout clears tokens from storage
- [ ] Environment variables are correct

---

**After applying these fixes, your frontend should maintain login state properly!**
