import { User, UserRole } from "@prisma/client";
import type { Request } from "express";
import type { User, UserRole } from "@prisma/client";

// JWT Payload interface
export interface JWTPayload {
  userId: string;
  email: string;
  role: UserRole;
  iat?: number;
  exp?: number;
}

// Authentication request interface extending Express Request
// Explicit AuthRequest to satisfy TS on all environments (Render/Express 5)
export interface AuthRequest extends Request {
  // Augmented auth fields
  user?:
    | (User & { userId?: string })
    | { id: string; email: string; role: UserRole };
  userId?: string;
  userRole?: UserRole;
  cookies?: Record<string, string>;
  // Ensure common Express fields are present in all build environments
  query: any;
  params: any;
  body: any;
  headers: any;
  method: string;
  path: string;
  originalUrl: string;
}

// User registration interface
export interface RegisterUserData {
  name: string;
  email: string;
  password: string;
  phone: string;
  role?: UserRole;
}

// User login interface
export interface LoginUserData {
  email: string;
  password: string;
}

// Authentication response interface
export interface AuthResponse {
  user: Omit<User, "password">;
  accessToken: string;
  refreshToken: string;
}

// Authenticated request interface with user details
// Note: This now matches the global Express.Request extension in express.d.ts
export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: UserRole;
  };
}

// Token refresh interface
export interface RefreshTokenData {
  refreshToken: string;
}

// Password reset interfaces
export interface ForgotPasswordData {
  email: string;
}

export interface ResetPasswordData {
  token: string;
  password: string;
}

// Error response interface
export interface ErrorResponse {
  success: false;
  message: string;
  errors?: string[];
  statusCode: number;
}

// Success response interface
export interface SuccessResponse<T = any> {
  success: true;
  message: string;
  data?: T;
  statusCode: number;
}
