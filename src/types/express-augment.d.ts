import type { UserRole } from "@prisma/client";

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: UserRole;
      } & Record<string, any>;
      userId?: string;
      userRole?: UserRole;
      cookies?: Record<string, string>;
    }
  }
}

export {};
