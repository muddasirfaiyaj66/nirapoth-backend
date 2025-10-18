import * as express from "express";
import { UserRole } from "@prisma/client";
import { AuthenticatedRequest } from "../types/auth";

type Response = express.Response;
type NextFunction = express.NextFunction;

export const roleMiddleware = (allowedRoles: UserRole[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const userRole = req.user?.role;

      if (!userRole) {
        return res.status(401).json({
          success: false,
          message: "Authentication required",
        });
      }

      if (!allowedRoles.includes(userRole)) {
        return res.status(403).json({
          success: false,
          message: "Access denied. Insufficient permissions.",
        });
      }

      next();
    } catch (error) {
      console.error("Role middleware error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  };
};
