"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const role_middleware_1 = require("../middlewares/role.middleware");
const notification_controller_1 = require("../controllers/notification.controller");
const client_1 = require("@prisma/client");
const router = (0, express_1.Router)();
// All routes require authentication
router.use(auth_middleware_1.authenticateToken);
// User routes - accessible to all authenticated users
router.get("/", notification_controller_1.NotificationController.getMyNotifications);
router.get("/unread-count", notification_controller_1.NotificationController.getUnreadCount);
router.get("/stats", notification_controller_1.NotificationController.getNotificationStats);
router.put("/:id/read", notification_controller_1.NotificationController.markAsRead);
router.put("/read-all", notification_controller_1.NotificationController.markAllAsRead);
router.delete("/:id", notification_controller_1.NotificationController.deleteNotification);
router.delete("/read", notification_controller_1.NotificationController.deleteAllRead);
// Admin routes - restricted to admin roles
router.post("/", (0, role_middleware_1.roleMiddleware)([client_1.UserRole.SUPER_ADMIN, client_1.UserRole.ADMIN]), notification_controller_1.NotificationController.createNotification);
router.post("/broadcast", (0, role_middleware_1.roleMiddleware)([client_1.UserRole.SUPER_ADMIN, client_1.UserRole.ADMIN]), notification_controller_1.NotificationController.broadcastNotification);
router.post("/send-to-role", (0, role_middleware_1.roleMiddleware)([client_1.UserRole.SUPER_ADMIN, client_1.UserRole.ADMIN]), notification_controller_1.NotificationController.sendToRole);
exports.default = router;
