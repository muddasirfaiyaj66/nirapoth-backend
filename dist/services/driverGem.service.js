"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CitizenGemService = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
class CitizenGemService {
    /**
     * Updates citizen gem amount and automatically sets isRestricted based on gem count
     * If gems <= 0, isRestricted is automatically set to true
     */
    static async updateCitizenGems(citizenId, newAmount) {
        const isRestricted = newAmount <= 0;
        return await prisma.citizenGem.upsert({
            where: { citizenId },
            update: {
                amount: newAmount,
                isRestricted,
            },
            create: {
                citizenId,
                amount: newAmount,
                isRestricted,
            },
        });
    }
    /**
     * Decreases citizen gems by specified amount
     * Automatically restricts citizen if gems fall to 0 or below
     */
    static async decreaseGems(citizenId, decreaseBy) {
        const currentGem = await prisma.citizenGem.findUnique({
            where: { citizenId },
        });
        const currentAmount = currentGem?.amount || 0;
        const newAmount = Math.max(0, currentAmount - decreaseBy);
        return await this.updateCitizenGems(citizenId, newAmount);
    }
    /**
     * Increases citizen gems by specified amount
     * Automatically unrestricts citizen if gems become positive
     */
    static async increaseGems(citizenId, increaseBy) {
        const currentGem = await prisma.citizenGem.findUnique({
            where: { citizenId },
        });
        const currentAmount = currentGem?.amount || 0;
        const newAmount = currentAmount + increaseBy;
        return await this.updateCitizenGems(citizenId, newAmount);
    }
    /**
     * Gets citizen gem information including restriction status
     */
    static async getCitizenGems(citizenId) {
        return await prisma.citizenGem.findUnique({
            where: { citizenId },
            include: {
                citizen: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                        isBlocked: true,
                        isDeleted: true,
                    },
                },
            },
        });
    }
    /**
     * Manually set restriction status (admin function)
     * Note: If gems <= 0, restriction will always be true regardless of manual setting
     */
    static async setRestrictionStatus(citizenId, isRestricted) {
        const currentGem = await prisma.citizenGem.findUnique({
            where: { citizenId },
        });
        const currentAmount = currentGem?.amount || 0;
        // If gems are <= 0, restriction must be true
        const finalRestrictionStatus = currentAmount <= 0 ? true : isRestricted;
        return await prisma.citizenGem.upsert({
            where: { citizenId },
            update: {
                isRestricted: finalRestrictionStatus,
            },
            create: {
                citizenId,
                amount: currentAmount,
                isRestricted: finalRestrictionStatus,
            },
        });
    }
}
exports.CitizenGemService = CitizenGemService;
