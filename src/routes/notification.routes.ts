import express from "express";
import { authenticateToken } from "../middlewares/auth.middleware";
import { roleMiddleware } from "../middlewares/role.middleware";
import { NotificationController } from "../controllers/notification.controller";
import { UserRole } from "@prisma/client";

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// User routes - accessible to all authenticated users
router.get("/", NotificationController.getMyNotifications);
router.get("/unread-count", NotificationController.getUnreadCount);
router.get("/stats", NotificationController.getNotificationStats);
router.put("/:id/read", NotificationController.markAsRead);
router.put("/read-all", NotificationController.markAllAsRead);
router.delete("/:id", NotificationController.deleteNotification);
router.delete("/read", NotificationController.deleteAllRead);

// Admin routes - restricted to admin roles
router.post(
  "/",
  roleMiddleware([UserRole.SUPER_ADMIN, UserRole.ADMIN]),
  NotificationController.createNotification
);
router.post(
  "/broadcast",
  roleMiddleware([UserRole.SUPER_ADMIN, UserRole.ADMIN]),
  NotificationController.broadcastNotification
);
router.post(
  "/send-to-role",
  roleMiddleware([UserRole.SUPER_ADMIN, UserRole.ADMIN]),
  NotificationController.sendToRole
);

export default router;
