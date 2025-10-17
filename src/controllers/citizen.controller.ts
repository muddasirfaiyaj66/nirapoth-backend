import { Response } from "express";
import { AuthRequest } from "../types/auth";
import { prisma } from "../lib/prisma";
import { Prisma } from "@prisma/client";

/**
 * Get citizen dashboard statistics
 * @route GET /api/citizen/stats
 */
export const getCitizenStats = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated",
        statusCode: 401,
      });
    }

    // Get vehicles count
    const [totalVehicles, activeVehicles] = await Promise.all([
      prisma.vehicle.count({
        where: { ownerId: userId },
      }),
      prisma.vehicle.count({
        where: { ownerId: userId, isActive: true },
      }),
    ]);

    // Get violations count (violations related to user's vehicles)
    const [totalViolations, pendingViolations] = await Promise.all([
      prisma.violation.count({
        where: {
          vehicle: { ownerId: userId },
        },
      }),
      prisma.violation.count({
        where: {
          vehicle: { ownerId: userId },
          status: { in: ["PENDING", "CONFIRMED"] },
        },
      }),
    ]);

    // Get fines statistics (fines on user's vehicles)
    const fines = await prisma.fine.aggregate({
      where: {
        violation: {
          vehicle: { ownerId: userId },
        },
      },
      _sum: { amount: true },
      _count: true,
    });

    const paidFines = await prisma.fine.aggregate({
      where: {
        violation: {
          vehicle: { ownerId: userId },
        },
        status: "PAID",
      },
      _sum: { amount: true },
    });

    // Get submitted complaints/reports
    const [submittedComplaints, resolvedComplaints] = await Promise.all([
      prisma.citizenReport.count({
        where: { citizenId: userId },
      }),
      prisma.citizenReport.count({
        where: { citizenId: userId, status: "APPROVED" },
      }),
    ]);

    // Get reward balance (only positive rewards, not penalties)
    const rewardTransactions = await prisma.rewardTransaction.findMany({
      where: {
        userId,
        status: "COMPLETED",
      },
      select: {
        amount: true,
        type: true,
      },
    });

    // Calculate actual rewards (positive only from REWARD and BONUS types)
    const totalRewards = rewardTransactions
      .filter((t) => t.type === "REWARD" || t.type === "BONUS")
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);

    // Get recent violations (last 5 fines on user's vehicles)
    const recentViolations = await prisma.fine.findMany({
      where: {
        violation: {
          vehicle: { ownerId: userId },
        },
      },
      include: {
        violation: {
          include: {
            rule: {
              select: {
                title: true,
              },
            },
            vehicle: {
              select: {
                plateNo: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 5,
    });

    // Get user vehicles (last 5)
    const myVehicles = await prisma.vehicle.findMany({
      where: { ownerId: userId },
      select: {
        id: true,
        plateNo: true,
        brand: true,
        model: true,
        year: true,
        isActive: true,
      },
      orderBy: { createdAt: "desc" },
      take: 5,
    });

    const stats = {
      totalVehicles,
      activeVehicles,
      totalViolations,
      pendingViolations,
      totalFines: fines._sum.amount || 0,
      paidFines: paidFines._sum.amount || 0,
      unpaidFines: (fines._sum.amount || 0) - (paidFines._sum.amount || 0),
      submittedComplaints,
      resolvedComplaints,
      totalRewards, // Only actual earned rewards
      recentViolations: recentViolations.map((fine) => ({
        id: fine.id,
        plateNo: fine.violation?.vehicle?.plateNo || "Unknown",
        violation: fine.violation?.rule?.title || "Unknown",
        fineAmount: fine.amount,
        date: fine.createdAt,
        status: fine.status,
        fineId: fine.id,
      })),
      myVehicles: myVehicles.map((v) => ({
        id: v.id,
        plateNo: v.plateNo,
        brand: v.brand || "Unknown",
        model: v.model || "Unknown",
        year: v.year,
        isActive: v.isActive,
      })),
    };

    return res.status(200).json({
      success: true,
      data: stats,
      statusCode: 200,
    });
  } catch (error) {
    console.error("Error fetching citizen stats:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch statistics",
      statusCode: 500,
    });
  }
};

/**
 * Get comprehensive citizen analytics for dashboard graphs
 * @route GET /api/citizen/analytics
 */
export const getCitizenAnalytics = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated",
        statusCode: 401,
      });
    }

    // Get current balance from reward transactions
    const rewardTransactions = await prisma.rewardTransaction.findMany({
      where: { userId, status: "COMPLETED" },
      select: { amount: true, type: true },
    });

    const totalRewards = rewardTransactions
      .filter((t) => t.type === "REWARD" || t.type === "BONUS")
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);

    const totalPenalties = rewardTransactions
      .filter((t) => t.type === "PENALTY" || t.type === "DEDUCTION")
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);

    const currentBalance = totalRewards - totalPenalties;

    // Get violations overview (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const violationsByMonth = await prisma.$queryRaw<
      Array<{ month: string; count: bigint }>
    >`
      SELECT 
        TO_CHAR(v."createdAt", 'Mon YYYY') as month,
        COUNT(*)::bigint as count
      FROM violations v
      INNER JOIN vehicles ve ON v."vehicleId" = ve.id
      WHERE ve."ownerId" = ${userId}
        AND v."createdAt" >= ${sixMonthsAgo}
      GROUP BY TO_CHAR(v."createdAt", 'Mon YYYY'), DATE_TRUNC('month', v."createdAt")
      ORDER BY DATE_TRUNC('month', v."createdAt") ASC
    `;

    // Get fines analytics (last 6 months)
    const finesByMonth = await prisma.$queryRaw<
      Array<{ month: string; total: number; paid: number; unpaid: number }>
    >`
      SELECT 
        TO_CHAR(f."createdAt", 'Mon YYYY') as month,
        SUM(f.amount)::int as total,
        SUM(CASE WHEN f.status = 'PAID' THEN f.amount ELSE 0 END)::int as paid,
        SUM(CASE WHEN f.status != 'PAID' THEN f.amount ELSE 0 END)::int as unpaid
      FROM fines f
      INNER JOIN violations v ON f."violationId" = v.id
      INNER JOIN vehicles ve ON v."vehicleId" = ve.id
      WHERE ve."ownerId" = ${userId}
        AND f."createdAt" >= ${sixMonthsAgo}
      GROUP BY TO_CHAR(f."createdAt", 'Mon YYYY'), DATE_TRUNC('month', f."createdAt")
      ORDER BY DATE_TRUNC('month', f."createdAt") ASC
    `;

    // Get rewards over time (last 6 months)
    const rewardsByMonth = await prisma.$queryRaw<
      Array<{ month: string; rewards: number; penalties: number }>
    >`
      SELECT 
        TO_CHAR(rt."createdAt", 'Mon YYYY') as month,
        SUM(CASE WHEN rt.type IN ('REWARD', 'BONUS') THEN ABS(rt.amount) ELSE 0 END)::int as rewards,
        SUM(CASE WHEN rt.type IN ('PENALTY', 'DEDUCTION') THEN ABS(rt.amount) ELSE 0 END)::int as penalties
      FROM reward_transactions rt
      WHERE rt."userId" = ${userId}
        AND rt.status = 'COMPLETED'
        AND rt."createdAt" >= ${sixMonthsAgo}
      GROUP BY TO_CHAR(rt."createdAt", 'Mon YYYY'), DATE_TRUNC('month', rt."createdAt")
      ORDER BY DATE_TRUNC('month', rt."createdAt") ASC
    `;

    // Get violation types breakdown
    const violationsByType = await prisma.$queryRaw<
      Array<{ type: string; count: bigint }>
    >`
      SELECT 
        r.title as type,
        COUNT(*)::bigint as count
      FROM violations v
      INNER JOIN vehicles ve ON v."vehicleId" = ve.id
      INNER JOIN rules r ON v."ruleId" = r.id
      WHERE ve."ownerId" = ${userId}
      GROUP BY r.title
      ORDER BY count DESC
      LIMIT 10
    `;

    // Get recent activity (last 10 items)
    const recentFines = await prisma.fine.findMany({
      where: {
        violation: { vehicle: { ownerId: userId } },
      },
      include: {
        violation: {
          include: {
            rule: { select: { title: true } },
            vehicle: { select: { plateNo: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 10,
    });

    const recentRewards = await prisma.rewardTransaction.findMany({
      where: { userId, status: "COMPLETED" },
      orderBy: { createdAt: "desc" },
      take: 10,
    });

    // Combine and sort recent activity
    const recentActivity = [
      ...recentFines.map((fine) => ({
        id: fine.id,
        type: "fine" as const,
        description: fine.violation?.rule?.title || "Fine",
        amount: fine.amount,
        status: fine.status,
        date: fine.createdAt,
        vehicle: fine.violation?.vehicle?.plateNo,
      })),
      ...recentRewards.map((reward) => ({
        id: reward.id,
        // Show deductions/penalties as negative-type entries in UI
        type: ["PENALTY", "DEDUCTION", "DEBT_PAYMENT"].includes(
          (reward as any).type
        )
          ? ("fine" as const)
          : ("reward" as const),
        description: reward.description || "Reward",
        // Use absolute for display; sign is driven by type in UI
        amount: Math.abs(Number(reward.amount)),
        status: reward.status,
        date: reward.createdAt,
      })),
    ]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 10);

    // Get total reports submitted
    const totalReports = await prisma.citizenReport.count({
      where: { citizenId: userId },
    });

    const approvedReports = await prisma.citizenReport.count({
      where: { citizenId: userId, status: "APPROVED" },
    });

    const analytics = {
      // Summary
      currentBalance,
      totalRewards,
      totalPenalties,
      totalReports,
      approvedReports,

      // Graphs data
      violationsOverview: violationsByMonth.map((v) => ({
        month: v.month,
        count: Number(v.count),
      })),

      finesAnalytics: finesByMonth.map((f) => ({
        month: f.month,
        total: f.total,
        paid: f.paid,
        unpaid: f.unpaid,
      })),

      rewardsOverTime: rewardsByMonth.map((r) => ({
        month: r.month,
        rewards: r.rewards,
        penalties: r.penalties,
        net: r.rewards - r.penalties,
      })),

      violationsByType: violationsByType.map((v) => ({
        type: v.type,
        count: Number(v.count),
      })),

      recentActivity,
    };

    // 📊 LOG BACKEND RESPONSE DATA
    console.log("\n====== BACKEND: SENDING CITIZEN ANALYTICS ======");
    console.log("User ID:", userId);
    console.log("📈 Current Balance:", currentBalance);
    console.log("💰 Total Rewards:", totalRewards);
    console.log("⚠️ Total Penalties:", totalPenalties);
    console.log("📝 Total Reports:", totalReports);
    console.log("✅ Approved Reports:", approvedReports);
    console.log("🔴 Violations Overview:", analytics.violationsOverview);
    console.log("💵 Fines Analytics:", analytics.finesAnalytics);
    console.log("📊 Rewards Over Time:", analytics.rewardsOverTime);
    console.log("🏷️ Violations By Type:", analytics.violationsByType);
    console.log("⏰ Recent Activity count:", analytics.recentActivity.length);
    console.log("================================================\n");

    return res.status(200).json({
      success: true,
      data: analytics,
      statusCode: 200,
    });
  } catch (error) {
    console.error("Error fetching citizen analytics:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch analytics",
      statusCode: 500,
    });
  }
};
