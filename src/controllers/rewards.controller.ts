import { Response } from "express";
import { PrismaClient } from "@prisma/client";
import { z } from "zod";
import { AuthRequest } from "../types/auth";

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
  static async getMyBalance(req: AuthRequest, res: Response): Promise<void> {
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

      // Get all completed transactions
      const transactions = await prisma.rewardTransaction.findMany({
        where: {
          userId,
          status: "COMPLETED",
        },
        select: {
          amount: true,
          type: true,
          status: true,
        },
      });

      // Also get rewards/penalties from citizen reports (for backward compatibility)
      // This ensures we include reports that were approved/rejected before reward transactions were implemented
      const citizenReports = await prisma.citizenReport.findMany({
        where: {
          citizenId: userId,
          status: { in: ["APPROVED", "REJECTED"] },
        },
        select: {
          status: true,
          rewardAmount: true,
          penaltyAmount: true,
        },
      });

      // Calculate totals from transactions
      const transactionEarnings = transactions
        .filter((t) => t.type === "REWARD" || t.type === "BONUS")
        .reduce((sum, t) => sum + t.amount, 0);

      const transactionPenalties = transactions
        .filter((t) => t.type === "PENALTY" || t.type === "DEDUCTION")
        .reduce((sum, t) => sum + Math.abs(t.amount), 0);

      // Calculate totals from citizen reports (for backward compatibility)
      const reportRewards = citizenReports
        .filter((r) => r.status === "APPROVED")
        .reduce((sum, r) => sum + (r.rewardAmount || 0), 0);

      const reportPenalties = citizenReports
        .filter((r) => r.status === "REJECTED")
        .reduce((sum, r) => sum + (r.penaltyAmount || 0), 0);

      // Combine both sources (this handles cases where reward transactions exist and where they don't)
      // Note: If reward transactions exist for all reports, this will double count
      // TODO: Implement proper sync mechanism or migration to ensure all reports have transactions
      const totalEarned = Math.max(transactionEarnings, reportRewards);
      const totalPenalties = Math.max(transactionPenalties, reportPenalties);

      // Get pending rewards
      const pendingRewards = await prisma.rewardTransaction.aggregate({
        where: {
          userId,
          status: "PENDING",
          type: { in: ["REWARD", "BONUS"] },
        },
        _sum: { amount: true },
      });

      // Get pending withdrawals amount
      const pendingWithdrawals = await prisma.withdrawalRequest.aggregate({
        where: {
          userId,
          status: { in: ["PENDING", "APPROVED"] },
        },
        _sum: { amount: true },
      });

      const currentBalance = totalEarned - totalPenalties;
      const withdrawableAmount = Math.max(
        0,
        currentBalance - (pendingWithdrawals._sum.amount || 0)
      );

      const balance = {
        userId,
        totalEarned,
        totalPenalties,
        currentBalance,
        pendingRewards: pendingRewards._sum.amount || 0,
        withdrawableAmount,
        lastUpdated: new Date().toISOString(),
      };

      res.status(200).json({
        success: true,
        data: balance,
        statusCode: 200,
      });
    } catch (error) {
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
  static async getMyTransactions(
    req: AuthRequest,
    res: Response
  ): Promise<void> {
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

      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const type = req.query.type as string;
      const source = req.query.source as string;
      const dateFrom = req.query.dateFrom as string;
      const dateTo = req.query.dateTo as string;

      const skip = (page - 1) * limit;

      const where: any = { userId };

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
    } catch (error) {
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
  static async getMyStats(req: AuthRequest, res: Response): Promise<void> {
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

      const [allTransactions, thisMonthTransactions, lastMonthTransactions] =
        await Promise.all([
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

      const approvedReports = reports.filter(
        (r) => r.status === "APPROVED"
      ).length;
      const rejectedReports = reports.filter(
        (r) => r.status === "REJECTED"
      ).length;

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
    } catch (error) {
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
  static async requestWithdrawal(
    req: AuthRequest,
    res: Response
  ): Promise<void> {
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

      const withdrawableAmount =
        currentBalance - (pendingWithdrawals._sum.amount || 0);

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
    } catch (error) {
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
  static async getMyWithdrawals(
    req: AuthRequest,
    res: Response
  ): Promise<void> {
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
    } catch (error) {
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
  static async cancelWithdrawal(
    req: AuthRequest,
    res: Response
  ): Promise<void> {
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
    } catch (error) {
      console.error("Error cancelling withdrawal:", error);
      res.status(500).json({
        success: false,
        message: "Failed to cancel withdrawal",
        statusCode: 500,
      });
    }
  }
}
