import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
export class NotificationService {
    /**
     * Send notification to user
     */
    static async sendNotification(data) {
        try {
            // In a real implementation, this would integrate with:
            // - Push notification services (FCM, APNS)
            // - Email notifications
            // - SMS services
            // - WebSocket connections
            // - In-app notifications
            console.log(`Notification sent to user ${data.userId}:`, {
                title: data.title,
                message: data.message,
                type: data.type,
                priority: data.priority || "MEDIUM",
                data: data.data,
            });
            // For now, we'll just log the notification
            // In production, you would:
            // 1. Store notification in database
            // 2. Send push notification
            // 3. Send email if needed
            // 4. Send SMS if urgent
            // 5. Update WebSocket connections
        }
        catch (error) {
            console.error("Error sending notification:", error);
        }
    }
    /**
     * Send violation notification
     */
    static async sendViolationNotification(userId, violationData) {
        await this.sendNotification({
            userId,
            title: "Traffic Violation Detected",
            message: `A traffic violation has been detected for vehicle ${violationData.vehiclePlate}. ${violationData.ruleTitle}${violationData.fineAmount ? ` - Fine: ৳${violationData.fineAmount}` : ""}`,
            type: "VIOLATION",
            data: violationData,
            priority: "HIGH",
        });
    }
    /**
     * Send fine notification
     */
    static async sendFineNotification(userId, fineData) {
        await this.sendNotification({
            userId,
            title: "New Fine Issued",
            message: `A fine of ৳${fineData.amount} has been issued for vehicle ${fineData.vehiclePlate}. Due date: ${fineData.dueDate.toLocaleDateString()}`,
            type: "FINE",
            data: fineData,
            priority: "HIGH",
        });
    }
    /**
     * Send complaint status update notification
     */
    static async sendComplaintStatusNotification(userId, complaintData) {
        await this.sendNotification({
            userId,
            title: "Complaint Status Update",
            message: `Your complaint "${complaintData.title}" status has been updated to ${complaintData.status}${complaintData.stationName ? ` by ${complaintData.stationName}` : ""}`,
            type: "COMPLAINT",
            data: complaintData,
            priority: "MEDIUM",
        });
    }
    /**
     * Send payment confirmation notification
     */
    static async sendPaymentConfirmationNotification(userId, paymentData) {
        await this.sendNotification({
            userId,
            title: "Payment Confirmed",
            message: `Your payment of ৳${paymentData.amount} via ${paymentData.method} has been confirmed.`,
            type: "PAYMENT",
            data: paymentData,
            priority: "MEDIUM",
        });
    }
    /**
     * Send system notification to all users
     */
    static async sendSystemNotification(title, message, priority = "MEDIUM") {
        try {
            // Get all active users
            const users = await prisma.user.findMany({
                where: {
                    isDeleted: false,
                    isBlocked: false,
                },
                select: { id: true },
            });
            // Send notification to all users
            for (const user of users) {
                await this.sendNotification({
                    userId: user.id,
                    title,
                    message,
                    type: "SYSTEM",
                    priority,
                });
            }
        }
        catch (error) {
            console.error("Error sending system notification:", error);
        }
    }
    /**
     * Send emergency notification to specific area
     */
    static async sendEmergencyNotification(area, title, message, priority = "URGENT") {
        try {
            // Get users in the specific area
            const users = await prisma.user.findMany({
                where: {
                    isDeleted: false,
                    isBlocked: false,
                    OR: [
                        { presentDistrict: { contains: area, mode: "insensitive" } },
                        { presentCity: { contains: area, mode: "insensitive" } },
                        { presentDivision: { contains: area, mode: "insensitive" } },
                    ],
                },
                select: { id: true },
            });
            // Send notification to users in the area
            for (const user of users) {
                await this.sendNotification({
                    userId: user.id,
                    title: `Emergency Alert - ${area}`,
                    message,
                    type: "SYSTEM",
                    priority,
                });
            }
        }
        catch (error) {
            console.error("Error sending emergency notification:", error);
        }
    }
    /**
     * Send driving license expiry reminder
     */
    static async sendLicenseExpiryReminder(userId, licenseData) {
        await this.sendNotification({
            userId,
            title: "Driving License Expiry Reminder",
            message: `Your driving license ${licenseData.licenseNo} will expire in ${licenseData.daysUntilExpiry} days (${licenseData.expiryDate.toLocaleDateString()}). Please renew it soon.`,
            type: "SYSTEM",
            data: licenseData,
            priority: licenseData.daysUntilExpiry <= 7 ? "HIGH" : "MEDIUM",
        });
    }
    /**
     * Send vehicle registration expiry reminder
     */
    static async sendVehicleRegistrationExpiryReminder(userId, vehicleData) {
        await this.sendNotification({
            userId,
            title: "Vehicle Registration Expiry Reminder",
            message: `Your vehicle registration for ${vehicleData.plateNo} will expire in ${vehicleData.daysUntilExpiry} days (${vehicleData.expiryDate.toLocaleDateString()}). Please renew it soon.`,
            type: "SYSTEM",
            data: vehicleData,
            priority: vehicleData.daysUntilExpiry <= 7 ? "HIGH" : "MEDIUM",
        });
    }
}
