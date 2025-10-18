import { User, UserRole } from "@prisma/client";
import * as express from "express";

// Use express.Request instead of importing Request directly
type Request = express.Request;

// JWT Payload interface
export interface JWTPayload {
  userId: string;
  email: string;
  role: UserRole;
  iat?: number;
  exp?: number;
}

// Authentication request interface extending Express Request
export interface AuthRequest extends Request {
  user?: User;
  userId?: string;
  userRole?: UserRole;
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
