import { PrismaClient, } from "@prisma/client";
import { sendNotificationToUser, sendUrgentNotification, } from "../config/socket";
const prisma = new PrismaClient();
export class NotificationService {
    /**
     * Send notification to user - persists to database
     */
    static async sendNotification(data) {
        try {
            // Create notification in database
            await prisma.notification.create({
                data: {
                    userId: data.userId,
                    title: data.title,
                    message: data.message,
                    type: data.type,
                    relatedEntityType: data.relatedEntityType,
                    relatedEntityId: data.relatedEntityId,
                    priority: data.priority || "NORMAL",
                    actionUrl: data.actionUrl,
                    actionLabel: data.actionLabel,
                    metadata: data.metadata
                        ? JSON.parse(JSON.stringify(data.metadata))
                        : null,
                    expiresAt: data.expiresAt,
                },
            });
            console.log(`✅ Notification created for user ${data.userId}: ${data.title}`);
            // Emit real-time notification via Socket.IO
            if (data.priority === "URGENT") {
                sendUrgentNotification(data.userId, {
                    userId: data.userId,
                    title: data.title,
                    message: data.message,
                    type: data.type,
                    priority: data.priority,
                    relatedEntityType: data.relatedEntityType,
                    relatedEntityId: data.relatedEntityId,
                    actionUrl: data.actionUrl,
                    actionLabel: data.actionLabel,
                    metadata: data.metadata,
                });
            }
            else {
                sendNotificationToUser(data.userId, {
                    userId: data.userId,
                    title: data.title,
                    message: data.message,
                    type: data.type,
                    priority: data.priority || "NORMAL",
                    relatedEntityType: data.relatedEntityType,
                    relatedEntityId: data.relatedEntityId,
                    actionUrl: data.actionUrl,
                    actionLabel: data.actionLabel,
                    metadata: data.metadata,
                });
            }
            // TODO: In production, you can also add:
            // 1. Send push notification (FCM, APNS)
            // 2. Send email if needed
            // 3. Send SMS if urgent
        }
        catch (error) {
            console.error("❌ Error creating notification:", error);
            throw error;
        }
    }
    /**
     * Send report submission notification
     */
    static async sendReportSubmittedNotification(userId, reportData) {
        await this.sendNotification({
            userId,
            title: "Report Submitted Successfully",
            message: `Your report has been submitted and is under review. Report ID: ${reportData.reportId}`,
            type: "REPORT_SUBMITTED",
            relatedEntityType: "REPORT",
            relatedEntityId: reportData.reportId,
            metadata: reportData,
            priority: "NORMAL",
        });
    }
    /**
     * Send report approved notification
     */
    static async sendReportApprovedNotification(userId, reportData) {
        await this.sendNotification({
            userId,
            title: "Report Approved",
            message: `Your report has been approved${reportData.rewardAmount
                ? ` and you earned ৳${reportData.rewardAmount} reward!`
                : "!"}`,
            type: "REPORT_APPROVED",
            relatedEntityType: "REPORT",
            relatedEntityId: reportData.reportId,
            metadata: reportData,
            priority: "HIGH",
        });
    }
    /**
     * Send report rejected notification
     */
    static async sendReportRejectedNotification(userId, reportData) {
        await this.sendNotification({
            userId,
            title: "Report Rejected",
            message: `Your report has been rejected${reportData.reason ? `: ${reportData.reason}` : "."}`,
            type: "REPORT_REJECTED",
            relatedEntityType: "REPORT",
            relatedEntityId: reportData.reportId,
            metadata: reportData,
            priority: "NORMAL",
        });
    }
    /**
     * Send reward earned notification
     */
    static async sendRewardEarnedNotification(userId, rewardData) {
        await this.sendNotification({
            userId,
            title: "Reward Earned!",
            message: `Congratulations! You've earned ৳${rewardData.amount} for ${rewardData.reason}`,
            type: "REWARD_EARNED",
            metadata: rewardData,
            priority: "HIGH",
        });
    }
    /**
     * Send payment received notification
     */
    static async sendPaymentReceivedNotification(userId, paymentData) {
        await this.sendNotification({
            userId,
            title: "Payment Received",
            message: `Your payment of ৳${paymentData.amount} has been received. Transaction ID: ${paymentData.transactionId}`,
            type: "PAYMENT_RECEIVED",
            metadata: paymentData,
            priority: "NORMAL",
        });
    }
    /**
     * Send system notification to all users
     */
    static async sendSystemNotification(title, message, priority = "NORMAL") {
        try {
            // Get all active users
            const users = await prisma.user.findMany({
                where: {
                    isDeleted: false,
                    isBlocked: false,
                },
                select: { id: true },
            });
            // Create notifications for all users in batch
            await prisma.notification.createMany({
                data: users.map((user) => ({
                    userId: user.id,
                    title,
                    message,
                    type: "SYSTEM",
                    priority,
                })),
            });
            console.log(`✅ System notification sent to ${users.length} users`);
        }
        catch (error) {
            console.error("❌ Error sending system notification:", error);
            throw error;
        }
    }
    /**
     * Send info notification
     */
    static async sendInfoNotification(userId, title, message, metadata) {
        await this.sendNotification({
            userId,
            title,
            message,
            type: "INFO",
            metadata,
            priority: "NORMAL",
        });
    }
    /**
     * Send warning notification
     */
    static async sendWarningNotification(userId, title, message, metadata) {
        await this.sendNotification({
            userId,
            title,
            message,
            type: "WARNING",
            metadata,
            priority: "HIGH",
        });
    }
    /**
     * Send success notification
     */
    static async sendSuccessNotification(userId, title, message, metadata) {
        await this.sendNotification({
            userId,
            title,
            message,
            type: "SUCCESS",
            metadata,
            priority: "NORMAL",
        });
    }
    /**
     * Send error notification
     */
    static async sendErrorNotification(userId, title, message, metadata) {
        await this.sendNotification({
            userId,
            title,
            message,
            type: "ERROR",
            metadata,
            priority: "URGENT",
        });
    }
}
