import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
/**
 * Middleware to update user's last activity time on each authenticated request
 * This provides a simple way to track online/offline status without Socket.IO
 *
 * IMPORTANT: This middleware must be applied to protected routes AFTER auth middleware
 */
export const updateUserActivity = async (req, res, next) => {
    // Call next first to not block the request
    next();
    try {
        // Only update if user is authenticated
        if (req.user && req.user.id) {
            // Update user's activity in background (fire and forget)
            setImmediate(async () => {
                try {
                    await prisma.user.update({
                        where: { id: req.user.id },
                        data: {
                            isOnline: true,
                            lastActivityAt: new Date(),
                        },
                    });
                }
                catch (err) {
                    console.error("Failed to update user activity:", err);
                }
            });
        }
    }
    catch (error) {
        console.error("Error in updateUserActivity middleware:", error);
    }
};
/**
 * Helper function to mark user as offline
 * Call this when user logs out or session expires
 */
export const markUserOffline = async (userId) => {
    try {
        await prisma.user.update({
            where: { id: userId },
            data: {
                isOnline: false,
                lastSeenAt: new Date(),
            },
        });
    }
    catch (error) {
        console.error("Failed to mark user as offline:", error);
    }
};
/**
 * Cron job to mark inactive users as offline
 * Run this every 5 minutes to check for users who haven't been active
 */
export const markInactiveUsersOffline = async () => {
    try {
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
        const result = await prisma.user.updateMany({
            where: {
                isOnline: true,
                lastActivityAt: {
                    lt: fiveMinutesAgo,
                },
            },
            data: {
                isOnline: false,
                lastSeenAt: new Date(),
            },
        });
        if (result.count > 0) {
            console.log(`✅ Marked ${result.count} inactive users as offline`);
        }
    }
    catch (error) {
        console.error("Failed to mark inactive users as offline:", error);
    }
};
