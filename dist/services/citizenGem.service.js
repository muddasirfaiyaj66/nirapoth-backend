import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
export class CitizenGemService {
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
     * Sets restriction status for a citizen
     */
    static async setRestrictionStatus(citizenId, isRestricted) {
        return await prisma.citizenGem.upsert({
            where: { citizenId },
            update: {
                isRestricted,
            },
            create: {
                citizenId,
                amount: isRestricted ? 0 : 10, // Default starting gems
                isRestricted,
            },
        });
    }
    /**
     * Gets citizen gems information
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
                    },
                },
            },
        });
    }
    /**
     * Gets all citizens with their gem information
     */
    static async getAllCitizenGems() {
        return await prisma.citizenGem.findMany({
            include: {
                citizen: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                        role: true,
                    },
                },
            },
            orderBy: {
                updatedAt: "desc",
            },
        });
    }
    /**
     * Gets citizens with low gems (potentially restricted)
     */
    static async getCitizensWithLowGems(threshold = 5) {
        return await prisma.citizenGem.findMany({
            where: {
                amount: {
                    lte: threshold,
                },
            },
            include: {
                citizen: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                    },
                },
            },
        });
    }
}
