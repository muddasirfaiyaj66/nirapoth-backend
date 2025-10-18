import { User, UserRole } from "@prisma/client";
import type { Request } from "express-serve-static-core";

// Augment Express Request type globally
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: UserRole;
      };
      userId?: string;
      userRole?: UserRole;
    }
  }
}

// Also export an explicit AuthRequest type for better type safety
export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: UserRole;
  };
  userId?: string;
  userRole?: UserRole;
}

export {};
