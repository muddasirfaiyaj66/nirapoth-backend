import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
/**
 * Utility functions for managing soft deletion and status fields
 */
export class StatusUtils {
    /**
     * Marks a user as deleted (soft delete)
     */
    static async softDeleteUser(userId) {
        return await prisma.user.update({
            where: { id: userId },
            data: { isDeleted: true },
        });
    }
    /**
     * Marks a vehicle as deleted (soft delete)
     */
    static async softDeleteVehicle(vehicleId) {
        return await prisma.vehicle.update({
            where: { id: vehicleId },
            data: { isDeleted: true },
        });
    }
    /**
     * Blocks a user
     */
    static async blockUser(userId, blocked = true) {
        return await prisma.user.update({
            where: { id: userId },
            data: { isBlocked: blocked },
        });
    }
    /**
     * Gets all active (non-deleted, non-blocked) users
     */
    static async getActiveUsers() {
        return await prisma.user.findMany({
            where: {
                isDeleted: false,
                isBlocked: false,
            },
        });
    }
    /**
     * Gets all active (non-deleted) vehicles
     */
    static async getActiveVehicles() {
        return await prisma.vehicle.findMany({
            where: {
                isDeleted: false,
            },
        });
    }
    /**
     * Enforces driver gem constraints across all drivers
     * This should be run periodically or after batch operations
     */
    static async enforceDriverGemConstraints() {
        const violations = await prisma.citizenGem.findMany({
            where: {
                OR: [
                    // Cases where gems <= 0 but not restricted
                    {
                        amount: { lte: 0 },
                        isRestricted: false,
                    },
                ],
            },
        });
        if (violations.length > 0) {
            // Fix constraint violations
            await prisma.citizenGem.updateMany({
                where: {
                    amount: { lte: 0 },
                },
                data: {
                    isRestricted: true,
                },
            });
            console.log(`Fixed ${violations.length} driver gem constraint violations`);
        }
        return violations.length;
    }
    /**
     * Validates that a driver gem record meets the constraint requirements
     */
    static validateDriverGemConstraint(amount, isRestricted) {
        // If gems <= 0, must be restricted
        if (amount <= 0) {
            return isRestricted === true;
        }
        // If gems > 0, can be either restricted or not
        return true;
    }
}
