import { PrismaClient } from "@prisma/client";
import { z } from "zod";
const prisma = new PrismaClient();
// Validation schemas
const withdrawalRequestSchema = z.object({
    amount: z.number().positive("Amount must be positive"),
    method: z.enum(["BANK_TRANSFER", "MOBILE_BANKING", "CASH"]),
    accountDetails: z.object({
        accountNumber: z.string().optional(),
        accountName: z.string().optional(),
        bankName: z.string().optional(),
        mobileNumber: z.string().optional(),
    }),
});
export class RewardsController {
    /**
     * Get user's reward balance
     * @route GET /api/rewards/balance
     */
    static async getMyBalance(req, res) {
        try {
            const userId = req.user?.id;
            if (!userId) {
                res.status(401).json({
                    success: false,
                    message: "User not authenticated",
                    statusCode: 401,
                });
                return;
            }
            // ==========================================
            // CORRECT BALANCE CALCULATION
            // ==========================================
            // Balance = Rewards - Penalties (simple!)
            // Debt is shown separately (NOT subtracted from balance)
            // ==========================================
            // Get all completed transactions
            const transactions = await prisma.rewardTransaction.findMany({
                where: {
                    userId,
                    status: "COMPLETED",
                },
                select: {
                    id: true,
                    amount: true,
                    type: true,
                    source: true,
                    status: true,
                },
            });
            // Calculate REWARDS (money earned)
            const totalRewards = transactions
                .filter((t) => t.type === "REWARD" || t.type === "BONUS")
                .reduce((sum, t) => sum + Math.abs(t.amount), 0);
            // Calculate PENALTIES (money deducted from reports)
            const totalPenalties = transactions
                .filter((t) => t.type === "PENALTY" || t.type === "DEDUCTION")
                .reduce((sum, t) => sum + Math.abs(t.amount), 0);
            // Calculate FINE PAYMENTS (payments for traffic violations)
            const totalFinePayments = transactions
                .filter((t) => t.source === "FINE_PAYMENT")
                .reduce((sum, t) => sum + Math.abs(t.amount), 0);
            // Calculate DEBT PAYMENTS (payments made towards outstanding debt)
            const totalDebtPayments = transactions
                .filter((t) => t.type === "DEBT_PAYMENT")
                .reduce((sum, t) => sum + Math.abs(t.amount), 0);
            console.log("💰 Transaction Summary:", {
                totalRewards,
                totalPenalties,
                totalFinePayments,
                totalDebtPayments,
            });
            // ==========================================
            // CORE BALANCE = Rewards - Penalties
            // This can be positive or negative
            // If negative, debt is created separately
            // ==========================================
            const currentBalance = totalRewards - totalPenalties;
            console.log("💵 Core Balance Calculation:", {
                totalRewards,
                totalPenalties,
                currentBalance,
                status: currentBalance >= 0 ? "POSITIVE ✅" : "NEGATIVE (Debt) ⚠️",
                formula: `${totalRewards} - ${totalPenalties} = ${currentBalance}`,
            });
            // Get outstanding debts (shown separately, NOT subtracted from balance)
            const outstandingDebts = await prisma.outstandingDebt.findMany({
                where: {
                    userId,
                    status: { in: ["OUTSTANDING", "PARTIAL"] },
                },
                select: {
                    id: true,
                    originalAmount: true,
                    currentAmount: true,
                    paidAmount: true,
                    status: true,
                },
            });
            const totalOutstandingDebt = outstandingDebts.reduce((total, debt) => {
                const remaining = Math.abs(debt.currentAmount) - Math.abs(debt.paidAmount);
                return total + Math.max(0, remaining);
            }, 0);
            console.log("💳 Outstanding Debts (Separate Info):", {
                count: outstandingDebts.length,
                totalOutstandingDebt,
                note: "These are debts user needs to pay (shown separately, not subtracted from balance)",
            });
            // ==========================================
            // 🚀 AUTO-CLEARANCE: If balance is positive AND debt exists
            // Automatically clear debt from balance (without creating negatives)
            // ==========================================
            let finalBalance = currentBalance;
            let finalOutstandingDebt = totalOutstandingDebt;
            if (currentBalance > 0 && totalOutstandingDebt > 0) {
                console.log("🔄 AUTO-CLEARING DEBT:", {
                    beforeBalance: currentBalance,
                    beforeDebt: totalOutstandingDebt,
                    action: "Automatically clearing debt from positive balance",
                });
                if (currentBalance >= totalOutstandingDebt) {
                    // User has enough to clear ALL debt
                    finalBalance = currentBalance - totalOutstandingDebt;
                    finalOutstandingDebt = 0;
                    // Mark all debts as PAID
                    for (const debt of outstandingDebts) {
                        await prisma.outstandingDebt.update({
                            where: { id: debt.id },
                            data: {
                                status: "PAID",
                                paidAmount: Math.abs(debt.originalAmount),
                                updatedAt: new Date(),
                            },
                        });
                    }
                    console.log("✅ ALL DEBT CLEARED:", {
                        afterBalance: finalBalance,
                        afterDebt: finalOutstandingDebt,
                        clearedAmount: totalOutstandingDebt,
                    });
                }
                else {
                    // User has partial payment (balance < debt)
                    finalOutstandingDebt = Math.max(0, totalOutstandingDebt - currentBalance);
                    finalBalance = 0;
                    // Update debt with partial payment
                    for (const debt of outstandingDebts) {
                        const remaining = Math.abs(debt.currentAmount) - Math.abs(debt.paidAmount);
                        if (remaining > 0 && currentBalance > 0) {
                            const payAmount = Math.min(remaining, currentBalance);
                            await prisma.outstandingDebt.update({
                                where: { id: debt.id },
                                data: {
                                    paidAmount: Math.abs(debt.paidAmount) + payAmount,
                                    status: payAmount >= remaining ? "PAID" : "PARTIAL",
                                    updatedAt: new Date(),
                                },
                            });
                        }
                    }
                    console.log("⚠️ PARTIAL DEBT CLEARED:", {
                        afterBalance: finalBalance,
                        afterDebt: finalOutstandingDebt,
                        clearedAmount: currentBalance,
                    });
                }
            }
            // Get pending rewards
            const pendingRewards = await prisma.rewardTransaction.aggregate({
                where: {
                    userId,
                    status: "PENDING",
                    type: { in: ["REWARD", "BONUS"] },
                },
                _sum: { amount: true },
            });
            // Get pending withdrawals
            const pendingWithdrawals = await prisma.withdrawalRequest.aggregate({
                where: {
                    userId,
                    status: { in: ["PENDING", "APPROVED"] },
                },
                _sum: { amount: true },
            });
            // ==========================================
            // FINAL BALANCE (after auto-clearance)
            // ==========================================
            const availableBalance = finalBalance - (pendingWithdrawals._sum.amount || 0);
            const balance = {
                userId,
                totalEarned: totalRewards,
                totalPenalties,
                totalFinePayments,
                totalOutstandingDebt: finalOutstandingDebt,
                totalDebtPayments,
                currentBalance: finalBalance,
                pendingRewards: pendingRewards._sum.amount || 0,
                withdrawableAmount: Math.max(0, availableBalance),
                lastUpdated: new Date().toISOString(),
            };
            res.status(200).json({
                success: true,
                data: balance,
                statusCode: 200,
            });
        }
        catch (error) {
            console.error("Error fetching balance:", error);
            res.status(500).json({
                success: false,
                message: "Failed to fetch balance",
                statusCode: 500,
            });
        }
    }
    /**
     * Get user's reward transactions
     * @route GET /api/rewards/transactions
     */
    static async getMyTransactions(req, res) {
        try {
            const userId = req.user?.id;
            if (!userId) {
                res.status(401).json({
                    success: false,
                    message: "User not authenticated",
                    statusCode: 401,
                });
                return;
            }
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 20;
            const type = req.query.type;
            const source = req.query.source;
            const dateFrom = req.query.dateFrom;
            const dateTo = req.query.dateTo;
            const skip = (page - 1) * limit;
            const where = { userId };
            if (type) {
                where.type = type;
            }
            if (source) {
                where.source = source;
            }
            if (dateFrom || dateTo) {
                where.createdAt = {};
                if (dateFrom) {
                    where.createdAt.gte = new Date(dateFrom);
                }
                if (dateTo) {
                    where.createdAt.lte = new Date(dateTo);
                }
            }
            const [transactions, total] = await Promise.all([
                prisma.rewardTransaction.findMany({
                    where,
                    skip,
                    take: limit,
                    orderBy: { createdAt: "desc" },
                }),
                prisma.rewardTransaction.count({ where }),
            ]);
            res.status(200).json({
                success: true,
                data: {
                    transactions,
                    pagination: {
                        page,
                        limit,
                        total,
                        totalPages: Math.ceil(total / limit),
                    },
                },
                statusCode: 200,
            });
        }
        catch (error) {
            console.error("Error fetching transactions:", error);
            res.status(500).json({
                success: false,
                message: "Failed to fetch transactions",
                statusCode: 500,
            });
        }
    }
    /**
     * Get user's reward statistics
     * @route GET /api/rewards/stats
     */
    static async getMyStats(req, res) {
        try {
            const userId = req.user?.id;
            if (!userId) {
                res.status(401).json({
                    success: false,
                    message: "User not authenticated",
                    statusCode: 401,
                });
                return;
            }
            const now = new Date();
            const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
            const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
            const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
            const [allTransactions, thisMonthTransactions, lastMonthTransactions] = await Promise.all([
                prisma.rewardTransaction.findMany({
                    where: { userId, status: "COMPLETED" },
                    select: { amount: true, type: true },
                }),
                prisma.rewardTransaction.findMany({
                    where: {
                        userId,
                        status: "COMPLETED",
                        createdAt: { gte: thisMonthStart },
                    },
                    select: { amount: true, type: true },
                }),
                prisma.rewardTransaction.findMany({
                    where: {
                        userId,
                        status: "COMPLETED",
                        createdAt: { gte: lastMonthStart, lte: lastMonthEnd },
                    },
                    select: { amount: true, type: true },
                }),
            ]);
            const totalEarned = allTransactions
                .filter((t) => t.type === "REWARD" || t.type === "BONUS")
                .reduce((sum, t) => sum + t.amount, 0);
            const totalPenalties = allTransactions
                .filter((t) => t.type === "PENALTY" || t.type === "DEDUCTION")
                .reduce((sum, t) => sum + Math.abs(t.amount), 0);
            const thisMonthEarnings = thisMonthTransactions
                .filter((t) => t.type === "REWARD" || t.type === "BONUS")
                .reduce((sum, t) => sum + t.amount, 0);
            const lastMonthEarnings = lastMonthTransactions
                .filter((t) => t.type === "REWARD" || t.type === "BONUS")
                .reduce((sum, t) => sum + t.amount, 0);
            // Get approved and rejected reports
            const reports = await prisma.citizenReport.findMany({
                where: { citizenId: userId },
                select: { status: true },
            });
            const approvedReports = reports.filter((r) => r.status === "APPROVED").length;
            const rejectedReports = reports.filter((r) => r.status === "REJECTED").length;
            const stats = {
                totalTransactions: allTransactions.length,
                totalEarned,
                totalPenalties,
                netBalance: totalEarned - totalPenalties,
                approvedReports,
                rejectedReports,
                averageReward: approvedReports > 0 ? totalEarned / approvedReports : 0,
                thisMonthEarnings,
                lastMonthEarnings,
                transactionsByType: [
                    {
                        type: "REWARD",
                        count: allTransactions.filter((t) => t.type === "REWARD").length,
                        total: allTransactions
                            .filter((t) => t.type === "REWARD")
                            .reduce((sum, t) => sum + t.amount, 0),
                    },
                    {
                        type: "PENALTY",
                        count: allTransactions.filter((t) => t.type === "PENALTY").length,
                        total: allTransactions
                            .filter((t) => t.type === "PENALTY")
                            .reduce((sum, t) => sum + Math.abs(t.amount), 0),
                    },
                ],
                earningsTrend: [], // Can be implemented later with monthly aggregation
            };
            res.status(200).json({
                success: true,
                data: stats,
                statusCode: 200,
            });
        }
        catch (error) {
            console.error("Error fetching stats:", error);
            res.status(500).json({
                success: false,
                message: "Failed to fetch stats",
                statusCode: 500,
            });
        }
    }
    /**
     * Request a withdrawal
     * @route POST /api/rewards/withdraw
     */
    static async requestWithdrawal(req, res) {
        try {
            const userId = req.user?.id;
            if (!userId) {
                res.status(401).json({
                    success: false,
                    message: "User not authenticated",
                    statusCode: 401,
                });
                return;
            }
            // Validate request body
            const validation = withdrawalRequestSchema.safeParse(req.body);
            if (!validation.success) {
                res.status(400).json({
                    success: false,
                    message: "Invalid request data",
                    errors: validation.error.issues,
                    statusCode: 400,
                });
                return;
            }
            const { amount, method, accountDetails } = validation.data;
            // Check available balance
            const transactions = await prisma.rewardTransaction.findMany({
                where: { userId, status: "COMPLETED" },
                select: { amount: true, type: true },
            });
            const totalEarned = transactions
                .filter((t) => t.type === "REWARD" || t.type === "BONUS")
                .reduce((sum, t) => sum + t.amount, 0);
            const totalPenalties = transactions
                .filter((t) => t.type === "PENALTY" || t.type === "DEDUCTION")
                .reduce((sum, t) => sum + Math.abs(t.amount), 0);
            const currentBalance = totalEarned - totalPenalties;
            // Get pending withdrawals
            const pendingWithdrawals = await prisma.withdrawalRequest.aggregate({
                where: {
                    userId,
                    status: { in: ["PENDING", "APPROVED"] },
                },
                _sum: { amount: true },
            });
            const withdrawableAmount = currentBalance - (pendingWithdrawals._sum.amount || 0);
            if (amount > withdrawableAmount) {
                res.status(400).json({
                    success: false,
                    message: "Insufficient withdrawable balance",
                    statusCode: 400,
                });
                return;
            }
            // Create withdrawal request
            const withdrawal = await prisma.withdrawalRequest.create({
                data: {
                    userId,
                    amount,
                    method,
                    accountDetails,
                    status: "PENDING",
                },
            });
            res.status(201).json({
                success: true,
                data: withdrawal,
                message: "Withdrawal request submitted successfully",
                statusCode: 201,
            });
        }
        catch (error) {
            console.error("Error requesting withdrawal:", error);
            res.status(500).json({
                success: false,
                message: "Failed to request withdrawal",
                statusCode: 500,
            });
        }
    }
    /**
     * Get user's withdrawal requests
     * @route GET /api/rewards/withdrawals
     */
    static async getMyWithdrawals(req, res) {
        try {
            const userId = req.user?.id;
            if (!userId) {
                res.status(401).json({
                    success: false,
                    message: "User not authenticated",
                    statusCode: 401,
                });
                return;
            }
            const withdrawals = await prisma.withdrawalRequest.findMany({
                where: { userId },
                orderBy: { requestedAt: "desc" },
            });
            res.status(200).json({
                success: true,
                data: withdrawals,
                statusCode: 200,
            });
        }
        catch (error) {
            console.error("Error fetching withdrawals:", error);
            res.status(500).json({
                success: false,
                message: "Failed to fetch withdrawals",
                statusCode: 500,
            });
        }
    }
    /**
     * Cancel a withdrawal request
     * @route DELETE /api/rewards/withdrawals/:withdrawalId
     */
    static async cancelWithdrawal(req, res) {
        try {
            const userId = req.user?.id;
            const { withdrawalId } = req.params;
            if (!userId) {
                res.status(401).json({
                    success: false,
                    message: "User not authenticated",
                    statusCode: 401,
                });
                return;
            }
            // Check if withdrawal exists and belongs to user
            const withdrawal = await prisma.withdrawalRequest.findUnique({
                where: { id: withdrawalId },
            });
            if (!withdrawal) {
                res.status(404).json({
                    success: false,
                    message: "Withdrawal request not found",
                    statusCode: 404,
                });
                return;
            }
            if (withdrawal.userId !== userId) {
                res.status(403).json({
                    success: false,
                    message: "Unauthorized to cancel this withdrawal",
                    statusCode: 403,
                });
                return;
            }
            if (withdrawal.status !== "PENDING") {
                res.status(400).json({
                    success: false,
                    message: "Can only cancel pending withdrawals",
                    statusCode: 400,
                });
                return;
            }
            // Delete the withdrawal request
            await prisma.withdrawalRequest.delete({
                where: { id: withdrawalId },
            });
            res.status(200).json({
                success: true,
                message: "Withdrawal cancelled successfully",
                statusCode: 200,
            });
        }
        catch (error) {
            console.error("Error cancelling withdrawal:", error);
            res.status(500).json({
                success: false,
                message: "Failed to cancel withdrawal",
                statusCode: 500,
            });
        }
    }
}
