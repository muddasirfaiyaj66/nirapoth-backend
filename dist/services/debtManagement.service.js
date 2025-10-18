import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
/**
 * Service to manage outstanding debts and late payment penalties
 * - Tracks negative balances as debts
 * - Applies 2.5% late fee per week after 7 days
 * - Handles debt payments and status updates
 */
export class DebtManagementService {
    /**
     * Create an outstanding debt for a user with negative balance
     */
    static async createDebt(userId, amount, relatedTransactionId) {
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + 7); // 7 days from now
        return await prisma.outstandingDebt.create({
            data: {
                userId,
                originalAmount: Math.abs(amount),
                currentAmount: Math.abs(amount),
                dueDate,
                relatedTransactionId,
                status: "OUTSTANDING",
            },
        });
    }
    /**
     * Calculate late payment penalty (2.5% per week)
     */
    static calculateLateFee(originalAmount, weeksPastDue) {
        const weeklyRate = 0.025; // 2.5% per week
        return originalAmount * weeklyRate * weeksPastDue;
    }
    /**
     * Update late fees for all outstanding debts past due date
     */
    static async updateLateFeesForAllDebts() {
        const now = new Date();
        // Get all outstanding debts past due date
        const overdueDebts = await prisma.outstandingDebt.findMany({
            where: {
                status: "OUTSTANDING",
                dueDate: {
                    lt: now,
                },
            },
        });
        const updates = [];
        for (const debt of overdueDebts) {
            // Calculate weeks past due
            const daysPastDue = Math.floor((now.getTime() - debt.dueDate.getTime()) / (1000 * 60 * 60 * 24));
            const weeksPastDue = Math.floor(daysPastDue / 7);
            if (weeksPastDue > debt.weeksPastDue) {
                // Calculate new late fee
                const additionalWeeks = weeksPastDue - debt.weeksPastDue;
                const newLateFee = this.calculateLateFee(debt.originalAmount, additionalWeeks);
                const totalLateFees = debt.lateFees + newLateFee;
                const newCurrentAmount = debt.originalAmount + totalLateFees;
                updates.push(prisma.outstandingDebt.update({
                    where: { id: debt.id },
                    data: {
                        weeksPastDue,
                        lateFees: totalLateFees,
                        currentAmount: newCurrentAmount,
                        lastPenaltyDate: now,
                    },
                }));
            }
        }
        if (updates.length > 0) {
            await prisma.$transaction(updates);
            console.log(`✅ Updated late fees for ${updates.length} overdue debts`);
        }
        return updates.length;
    }
    /**
     * Record a debt payment
     */
    static async recordPayment(debtId, amount, paymentReference, tx) {
        const db = tx || prisma;
        const debt = await db.outstandingDebt.findUnique({
            where: { id: debtId },
        });
        if (!debt) {
            throw new Error("Debt not found");
        }
        console.log("📝 Recording payment - BEFORE:", {
            debtId,
            originalAmount: debt.originalAmount,
            currentAmount: debt.currentAmount,
            paidAmount: debt.paidAmount,
            status: debt.status,
            lateFees: debt.lateFees,
        });
        const newPaidAmount = debt.paidAmount + amount;
        const remainingAmount = debt.currentAmount - newPaidAmount;
        console.log("💰 Payment calculation:", {
            paymentAmount: amount,
            previousPaidAmount: debt.paidAmount,
            newPaidAmount,
            currentAmount: debt.currentAmount,
            remainingAmount,
        });
        let newStatus = debt.status;
        if (remainingAmount <= 0) {
            newStatus = "PAID";
            console.log("✅ Setting status to PAID (remaining <= 0)");
        }
        else if (newPaidAmount > 0) {
            newStatus = "PARTIAL";
            console.log("⚠️ Setting status to PARTIAL (partial payment)");
        }
        const updatedDebt = await db.outstandingDebt.update({
            where: { id: debtId },
            data: {
                paidAmount: newPaidAmount,
                status: newStatus,
                paidAt: newStatus === "PAID" ? new Date() : debt.paidAt,
                paymentReference,
            },
        });
        console.log("📝 Recording payment - AFTER:", {
            debtId,
            currentAmount: updatedDebt.currentAmount,
            paidAmount: updatedDebt.paidAmount,
            status: updatedDebt.status,
            remaining: updatedDebt.currentAmount - updatedDebt.paidAmount,
        });
        return updatedDebt;
    }
    /**
     * Get a debt by ID
     */
    static async getDebtById(debtId) {
        return await prisma.outstandingDebt.findUnique({
            where: { id: debtId },
            include: {
                user: {
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
     * Get all outstanding debts for a user
     */
    static async getUserDebts(userId) {
        return await prisma.outstandingDebt.findMany({
            where: {
                userId,
                status: { in: ["OUTSTANDING", "PARTIAL"] },
            },
            orderBy: {
                dueDate: "asc",
            },
        });
    }
    /**
     * Get total debt amount for a user (including late fees)
     */
    static async getTotalDebtAmount(userId) {
        const debts = await this.getUserDebts(userId);
        return debts.reduce((total, debt) => {
            return total + (debt.currentAmount - debt.paidAmount);
        }, 0);
    }
    /**
     * Waive a debt (admin action)
     */
    static async waiveDebt(debtId, adminId, notes) {
        return await prisma.outstandingDebt.update({
            where: { id: debtId },
            data: {
                status: "WAIVED",
                notes: notes || "Debt waived by administrator",
            },
        });
    }
    /**
     * Check if user has negative balance and create debt if needed
     */
    static async checkAndCreateDebtForNegativeBalance(userId) {
        console.log("🔍 Checking for negative balance for user:", userId);
        // ==========================================
        // INDUSTRY STANDARD BALANCE CALCULATION
        // Same logic as getMyBalance
        // ==========================================
        // Calculate current balance from transactions
        const transactions = await prisma.rewardTransaction.findMany({
            where: {
                userId,
                status: "COMPLETED",
            },
            select: {
                amount: true,
                type: true,
            },
        });
        console.log("📊 Found transactions:", transactions.length);
        // Calculate REWARDS (positive additions)
        const totalRewards = transactions
            .filter((t) => t.type === "REWARD" || t.type === "BONUS")
            .reduce((sum, t) => sum + Math.abs(t.amount), 0);
        // Calculate PENALTIES (deductions)
        const totalPenalties = transactions
            .filter((t) => t.type === "PENALTY" || t.type === "DEDUCTION")
            .reduce((sum, t) => sum + Math.abs(t.amount), 0);
        // Calculate DEBT PAYMENTS (already paid)
        const totalDebtPayments = transactions
            .filter((t) => t.type === "DEBT_PAYMENT")
            .reduce((sum, t) => sum + Math.abs(t.amount), 0);
        // Get outstanding debts
        // NOTE: Do not subtract outstanding debt here to avoid double counting.
        // Balance should reflect rewards vs penalties only.
        const currentBalance = totalRewards - totalPenalties;
        console.log("💰 Balance calculation for debt check:", {
            totalRewards,
            totalPenalties,
            totalDebtPayments,
            currentBalance,
            formula: `${totalRewards} - ${totalPenalties} = ${currentBalance}`,
        });
        // If balance is negative (after accounting for existing debts), create new debt
        if (currentBalance < 0) {
            console.log("⚠️ Negative balance detected:", currentBalance);
            const existingDebt = await prisma.outstandingDebt.findFirst({
                where: {
                    userId,
                    status: { in: ["OUTSTANDING", "PARTIAL"] },
                },
            });
            console.log("🔍 Existing debt check:", existingDebt ? "Found" : "None");
            const absoluteAmount = Math.abs(currentBalance);
            if (!existingDebt) {
                console.log("✅ Creating new debt for amount:", absoluteAmount);
                const newDebt = await this.createDebt(userId, currentBalance);
                console.log("✅ Debt created successfully:", newDebt.id);
                return newDebt;
            }
            else {
                // Update existing debt if the amount has changed
                const currentDebtAmount = existingDebt.currentAmount - existingDebt.paidAmount;
                if (Math.abs(currentDebtAmount - absoluteAmount) > 0.01) {
                    console.log("🔄 Updating existing debt from", currentDebtAmount, "to", absoluteAmount);
                    // Calculate the difference to adjust originalAmount and currentAmount
                    const adjustedOriginalAmount = existingDebt.originalAmount + (absoluteAmount - currentDebtAmount);
                    const updatedDebt = await prisma.outstandingDebt.update({
                        where: { id: existingDebt.id },
                        data: {
                            originalAmount: adjustedOriginalAmount,
                            currentAmount: existingDebt.paidAmount + absoluteAmount,
                        },
                    });
                    console.log("✅ Debt updated successfully:", {
                        oldOriginal: existingDebt.originalAmount,
                        newOriginal: adjustedOriginalAmount,
                        oldCurrent: existingDebt.currentAmount,
                        newCurrent: updatedDebt.currentAmount,
                        paidAmount: existingDebt.paidAmount,
                        remainingBalance: absoluteAmount,
                    });
                    return updatedDebt;
                }
                else {
                    console.log("ℹ️ Debt already exists with correct amount, skipping update");
                }
            }
        }
        else {
            console.log("✅ Balance is positive or zero:", currentBalance);
        }
        return null;
    }
}
