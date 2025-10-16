import { Response } from "express";
import { PrismaClient } from "@prisma/client";
import { AuthRequest } from "../types/auth";
import {
  sendNotificationToUser,
  sendNotificationToRole,
  broadcastNotification,
  sendUrgentNotification,
  broadcastUrgentNotification,
} from "../config/socket";

const prisma = new PrismaClient();

export class NotificationController {
  /**
   * Get all notifications for the current user
   */
  static async getMyNotifications(
    req: AuthRequest,
    res: Response
  ): Promise<void> {
    try {
      const user_id = req.user?.id;
      if (!user_id) {
        res.status(401).json({
          success: false,
          message: "Unauthorized",
          statusCode: 401,
        });
        return;
      }

      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const type = req.query.type as string;
      const priority = req.query.priority as string;
      const is_read =
        req.query.isRead === "true"
          ? true
          : req.query.isRead === "false"
          ? false
          : undefined;

      const skip = (page - 1) * limit;

      // Build where clause
      const where: any = {
        userId: user_id,
        OR: [{ expiresAt: null }, { expiresAt: { gte: new Date() } }],
      };

      if (type) where.type = type;
      if (priority) where.priority = priority;
      if (is_read !== undefined) where.isRead = is_read;

      // Get notifications and total count
      const [notifications, total] = await Promise.all([
        prisma.notification.findMany({
          where,
          skip,
          take: limit,
          orderBy: [{ createdAt: "desc" }],
        }),
        prisma.notification.count({ where }),
      ]);

      res.status(200).json({
        success: true,
        message: "Notifications retrieved successfully",
        data: {
          notifications,
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
          },
        },
        statusCode: 200,
      });
    } catch (error) {
      console.error("Error fetching notifications:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch notifications",
        error: error instanceof Error ? error.message : "Unknown error",
        statusCode: 500,
      });
    }
  }

  /**
   * Get unread notification count
   */
  static async getUnreadCount(req: AuthRequest, res: Response): Promise<void> {
    try {
      const user_id = req.user?.id;
      if (!user_id) {
        res.status(401).json({
          success: false,
          message: "Unauthorized",
          statusCode: 401,
        });
        return;
      }

      const count = await prisma.notification.count({
        where: {
          userId: user_id,
          isRead: false,
          OR: [{ expiresAt: null }, { expiresAt: { gte: new Date() } }],
        },
      });

      res.status(200).json({
        success: true,
        message: "Unread count retrieved successfully",
        data: { count },
        statusCode: 200,
      });
    } catch (error) {
      console.error("Error fetching unread count:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch unread count",
        error: error instanceof Error ? error.message : "Unknown error",
        statusCode: 500,
      });
    }
  }

  /**
   * Get notification statistics
   */
  static async getNotificationStats(
    req: AuthRequest,
    res: Response
  ): Promise<void> {
    try {
      const user_id = req.user?.id;
      if (!user_id) {
        res.status(401).json({
          success: false,
          message: "Unauthorized",
          statusCode: 401,
        });
        return;
      }

      const [total, unread, by_type, by_priority] = await Promise.all([
        prisma.notification.count({
          where: {
            userId: user_id,
            OR: [{ expiresAt: null }, { expiresAt: { gte: new Date() } }],
          },
        }),
        prisma.notification.count({
          where: {
            userId: user_id,
            isRead: false,
            OR: [{ expiresAt: null }, { expiresAt: { gte: new Date() } }],
          },
        }),
        prisma.notification.groupBy({
          by: ["type"],
          _count: { type: true },
          where: {
            userId: user_id,
            OR: [{ expiresAt: null }, { expiresAt: { gte: new Date() } }],
          },
        }),
        prisma.notification.groupBy({
          by: ["priority"],
          _count: { priority: true },
          where: {
            userId: user_id,
            OR: [{ expiresAt: null }, { expiresAt: { gte: new Date() } }],
          },
        }),
      ]);

      res.status(200).json({
        success: true,
        message: "Notification statistics retrieved successfully",
        data: {
          total,
          unread,
          byType: by_type.map((item) => ({
            type: item.type,
            count: item._count.type,
          })),
          byPriority: by_priority.map((item) => ({
            priority: item.priority,
            count: item._count.priority,
          })),
        },
        statusCode: 200,
      });
    } catch (error) {
      console.error("Error fetching notification stats:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch notification statistics",
        error: error instanceof Error ? error.message : "Unknown error",
        statusCode: 500,
      });
    }
  }

  /**
   * Mark notification as read
   */
  static async markAsRead(req: AuthRequest, res: Response): Promise<void> {
    try {
      const user_id = req.user?.id;
      const notification_id = req.params.id;

      if (!user_id) {
        res.status(401).json({
          success: false,
          message: "Unauthorized",
          statusCode: 401,
        });
        return;
      }

      // Check if notification exists and belongs to user
      const notification = await prisma.notification.findUnique({
        where: { id: notification_id },
      });

      if (!notification) {
        res.status(404).json({
          success: false,
          message: "Notification not found",
          statusCode: 404,
        });
        return;
      }

      if (notification.userId !== user_id) {
        res.status(403).json({
          success: false,
          message: "Access denied",
          statusCode: 403,
        });
        return;
      }

      // Update notification
      const updated_notification = await prisma.notification.update({
        where: { id: notification_id },
        data: {
          isRead: true,
          readAt: new Date(),
        },
      });

      res.status(200).json({
        success: true,
        message: "Notification marked as read",
        data: updated_notification,
        statusCode: 200,
      });
    } catch (error) {
      console.error("Error marking notification as read:", error);
      res.status(500).json({
        success: false,
        message: "Failed to mark notification as read",
        error: error instanceof Error ? error.message : "Unknown error",
        statusCode: 500,
      });
    }
  }

  /**
   * Mark all notifications as read
   */
  static async markAllAsRead(req: AuthRequest, res: Response): Promise<void> {
    try {
      const user_id = req.user?.id;
      if (!user_id) {
        res.status(401).json({
          success: false,
          message: "Unauthorized",
          statusCode: 401,
        });
        return;
      }

      await prisma.notification.updateMany({
        where: {
          userId: user_id,
          isRead: false,
        },
        data: {
          isRead: true,
          readAt: new Date(),
        },
      });

      res.status(200).json({
        success: true,
        message: "All notifications marked as read",
        statusCode: 200,
      });
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
      res.status(500).json({
        success: false,
        message: "Failed to mark all notifications as read",
        error: error instanceof Error ? error.message : "Unknown error",
        statusCode: 500,
      });
    }
  }

  /**
   * Delete a notification
   */
  static async deleteNotification(
    req: AuthRequest,
    res: Response
  ): Promise<void> {
    try {
      const user_id = req.user?.id;
      const notification_id = req.params.id;

      if (!user_id) {
        res.status(401).json({
          success: false,
          message: "Unauthorized",
          statusCode: 401,
        });
        return;
      }

      // Check if notification exists and belongs to user
      const notification = await prisma.notification.findUnique({
        where: { id: notification_id },
      });

      if (!notification) {
        res.status(404).json({
          success: false,
          message: "Notification not found",
          statusCode: 404,
        });
        return;
      }

      if (notification.userId !== user_id) {
        res.status(403).json({
          success: false,
          message: "Access denied",
          statusCode: 403,
        });
        return;
      }

      await prisma.notification.delete({
        where: { id: notification_id },
      });

      res.status(200).json({
        success: true,
        message: "Notification deleted successfully",
        statusCode: 200,
      });
    } catch (error) {
      console.error("Error deleting notification:", error);
      res.status(500).json({
        success: false,
        message: "Failed to delete notification",
        error: error instanceof Error ? error.message : "Unknown error",
        statusCode: 500,
      });
    }
  }

  /**
   * Delete all read notifications
   */
  static async deleteAllRead(req: AuthRequest, res: Response): Promise<void> {
    try {
      const user_id = req.user?.id;
      if (!user_id) {
        res.status(401).json({
          success: false,
          message: "Unauthorized",
          statusCode: 401,
        });
        return;
      }

      await prisma.notification.deleteMany({
        where: {
          userId: user_id,
          isRead: true,
        },
      });

      res.status(200).json({
        success: true,
        message: "All read notifications deleted successfully",
        statusCode: 200,
      });
    } catch (error) {
      console.error("Error deleting read notifications:", error);
      res.status(500).json({
        success: false,
        message: "Failed to delete read notifications",
        error: error instanceof Error ? error.message : "Unknown error",
        statusCode: 500,
      });
    }
  }

  /**
   * Create a new notification (Admin only)
   */
  static async createNotification(
    req: AuthRequest,
    res: Response
  ): Promise<void> {
    try {
      const {
        title,
        message,
        type,
        priority = "NORMAL",
        targetUserId,
        targetRole,
        relatedEntityType,
        relatedEntityId,
        actionUrl,
        actionLabel,
        metadata,
        expiresAt,
      } = req.body;

      // Validate required fields
      if (!title || !message || !type) {
        res.status(400).json({
          success: false,
          message: "Title, message, and type are required",
          statusCode: 400,
        });
        return;
      }

      // Determine target users
      let target_user_ids: string[] = [];

      if (targetUserId) {
        target_user_ids = [targetUserId];
      } else if (targetRole) {
        const users = await prisma.user.findMany({
          where: { role: targetRole, isDeleted: false, isBlocked: false },
          select: { id: true },
        });
        target_user_ids = users.map((u) => u.id);
      } else {
        res.status(400).json({
          success: false,
          message: "Either targetUserId or targetRole must be provided",
          statusCode: 400,
        });
        return;
      }

      // Create notifications for all target users
      const notification_data = target_user_ids.map((userId) => ({
        userId,
        title,
        message,
        type,
        priority,
        relatedEntityType,
        relatedEntityId,
        actionUrl,
        actionLabel,
        metadata: metadata ? JSON.parse(JSON.stringify(metadata)) : null,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
      }));

      const notifications = await prisma.notification.createMany({
        data: notification_data,
      });

      // Emit socket events for real-time delivery
      for (const userId of target_user_ids) {
        const notification_to_send = notification_data.find(
          (n) => n.userId === userId
        );
        if (notification_to_send) {
          if (priority === "URGENT") {
            sendUrgentNotification(userId, notification_to_send);
          } else {
            sendNotificationToUser(userId, notification_to_send);
          }
        }
      }

      res.status(201).json({
        success: true,
        message: `Notification sent to ${target_user_ids.length} user(s)`,
        data: { count: notifications.count },
        statusCode: 201,
      });
    } catch (error) {
      console.error("Error creating notification:", error);
      res.status(500).json({
        success: false,
        message: "Failed to create notification",
        error: error instanceof Error ? error.message : "Unknown error",
        statusCode: 500,
      });
    }
  }

  /**
   * Broadcast notification to all users (Admin only)
   */
  static async broadcastNotification(
    req: AuthRequest,
    res: Response
  ): Promise<void> {
    try {
      const { title, message, type, priority = "NORMAL" } = req.body;

      // Validate required fields
      if (!title || !message || !type) {
        res.status(400).json({
          success: false,
          message: "Title, message, and type are required",
          statusCode: 400,
        });
        return;
      }

      // Get all active users
      const users = await prisma.user.findMany({
        where: { isDeleted: false, isBlocked: false },
        select: { id: true },
      });

      // Create notifications for all users individually so we can emit each one
      const created_notifications = await Promise.all(
        users.map(async (user) => {
          return await prisma.notification.create({
            data: {
              userId: user.id,
              title,
              message,
              type,
              priority,
            },
          });
        })
      );

      // Emit socket event for each user with their specific notification
      created_notifications.forEach((notification) => {
        if (priority === "URGENT") {
          sendUrgentNotification(notification.userId, notification);
        } else {
          sendNotificationToUser(notification.userId, notification);
        }
      });

      res.status(201).json({
        success: true,
        message: `Notification broadcast to ${users.length} users`,
        data: { count: created_notifications.length },
        statusCode: 201,
      });
    } catch (error) {
      console.error("Error broadcasting notification:", error);
      res.status(500).json({
        success: false,
        message: "Failed to broadcast notification",
        error: error instanceof Error ? error.message : "Unknown error",
        statusCode: 500,
      });
    }
  }

  /**
   * Send notification to specific role (Admin only)
   */
  static async sendToRole(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { role, title, message, type, priority = "NORMAL" } = req.body;

      // Validate required fields
      if (!role || !title || !message || !type) {
        res.status(400).json({
          success: false,
          message: "Role, title, message, and type are required",
          statusCode: 400,
        });
        return;
      }

      // Get users with the specified role
      const users = await prisma.user.findMany({
        where: { role, isDeleted: false, isBlocked: false },
        select: { id: true },
      });

      if (users.length === 0) {
        res.status(404).json({
          success: false,
          message: `No users found with role: ${role}`,
          statusCode: 404,
        });
        return;
      }

      // Create notifications for all users with the role
      const created_notifications = await Promise.all(
        users.map(async (user) => {
          return await prisma.notification.create({
            data: {
              userId: user.id,
              title,
              message,
              type,
              priority,
            },
          });
        })
      );

      // Emit socket event for each user with their specific notification
      created_notifications.forEach((notification) => {
        if (priority === "URGENT") {
          sendUrgentNotification(notification.userId, notification);
        } else {
          sendNotificationToUser(notification.userId, notification);
        }
      });

      res.status(201).json({
        success: true,
        message: `Notification sent to ${users.length} users with role ${role}`,
        data: { count: created_notifications.length },
        statusCode: 201,
      });
    } catch (error) {
      console.error("Error sending notification to role:", error);
      res.status(500).json({
        success: false,
        message: "Failed to send notification to role",
        error: error instanceof Error ? error.message : "Unknown error",
        statusCode: 500,
      });
    }
  }
}
