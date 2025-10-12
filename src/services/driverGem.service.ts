import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export class DriverGemService {
  /**
   * Updates driver gem amount and automatically sets isRestricted based on gem count
   * If gems <= 0, isRestricted is automatically set to true
   */
  static async updateDriverGems(driverId: string, newAmount: number) {
    const isRestricted = newAmount <= 0;

    return await prisma.driverGem.upsert({
      where: { driverId },
      update: {
        amount: newAmount,
        isRestricted,
      },
      create: {
        driverId,
        amount: newAmount,
        isRestricted,
      },
    });
  }

  /**
   * Decreases driver gems by specified amount
   * Automatically restricts driver if gems fall to 0 or below
   */
  static async decreaseGems(driverId: string, decreaseBy: number) {
    const currentGem = await prisma.driverGem.findUnique({
      where: { driverId },
    });

    const currentAmount = currentGem?.amount || 0;
    const newAmount = Math.max(0, currentAmount - decreaseBy);

    return await this.updateDriverGems(driverId, newAmount);
  }

  /**
   * Increases driver gems by specified amount
   * Automatically unrestricts driver if gems become positive
   */
  static async increaseGems(driverId: string, increaseBy: number) {
    const currentGem = await prisma.driverGem.findUnique({
      where: { driverId },
    });

    const currentAmount = currentGem?.amount || 0;
    const newAmount = currentAmount + increaseBy;

    return await this.updateDriverGems(driverId, newAmount);
  }

  /**
   * Gets driver gem information including restriction status
   */
  static async getDriverGems(driverId: string) {
    return await prisma.driverGem.findUnique({
      where: { driverId },
      include: {
        driver: {
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
  static async setRestrictionStatus(driverId: string, isRestricted: boolean) {
    const currentGem = await prisma.driverGem.findUnique({
      where: { driverId },
    });

    const currentAmount = currentGem?.amount || 0;

    // If gems are <= 0, restriction must be true
    const finalRestrictionStatus = currentAmount <= 0 ? true : isRestricted;

    return await prisma.driverGem.upsert({
      where: { driverId },
      update: {
        isRestricted: finalRestrictionStatus,
      },
      create: {
        driverId,
        amount: currentAmount,
        isRestricted: finalRestrictionStatus,
      },
    });
  }
}
