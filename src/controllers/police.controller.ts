import { Response } from "express";
import { AuthRequest } from "../types/auth";
import { prisma } from "../lib/prisma";

/**
 * Get police dashboard statistics
 * @route GET /api/police/stats
 */
export const getPoliceStats = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated",
        statusCode: 401,
      });
    }

    // Get violations assigned to this police officer or in their station
    const assignedViolations = await prisma.violation.count({
      where: {
        // Add filter for police jurisdiction if needed
      },
    });

    const pendingViolations = await prisma.violation.count({
      where: {
        status: "PENDING",
      },
    });

    const resolvedViolations = await prisma.violation.count({
      where: {
        status: "RESOLVED",
      },
    });

    // Get fines issued
    const totalFinesIssued = await prisma.fine.count();

    const unpaidFines = await prisma.fine.count({
      where: { status: "UNPAID" },
    });

    const paidFines = await prisma.fine.count({
      where: { status: "PAID" },
    });

    // Get citizen reports for review
    const pendingReports = await prisma.citizenReport.count({
      where: { status: "PENDING" },
    });

    const approvedReports = await prisma.citizenReport.count({
      where: { status: "APPROVED" },
    });

    // Get recent violations
    const recentViolations = await prisma.violation.findMany({
      include: {
        vehicle: {
          select: {
            plateNo: true,
            brand: true,
            model: true,
          },
        },
        rule: {
          select: {
            title: true,
            penalty: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 10,
    });

    const stats = {
      assignedViolations,
      pendingViolations,
      resolvedViolations,
      totalFinesIssued,
      unpaidFines,
      paidFines,
      pendingReports,
      approvedReports,
      recentViolations: recentViolations.map((v) => ({
        id: v.id,
        plateNo: v.vehicle?.plateNo || "Unknown",
        vehicleInfo: `${v.vehicle?.brand || ""} ${
          v.vehicle?.model || ""
        }`.trim(),
        violation: v.rule?.title || "Unknown",
        penalty: v.rule?.penalty || 0,
        status: v.status,
        date: v.createdAt,
      })),
    };

    return res.status(200).json({
      success: true,
      data: stats,
      statusCode: 200,
    });
  } catch (error) {
    console.error("Error fetching police stats:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch statistics",
      statusCode: 500,
    });
  }
};

/**
 * Get police analytics for dashboard graphs
 * @route GET /api/police/analytics
 */
export const getPoliceAnalytics = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated",
        statusCode: 401,
      });
    }

    // Violations by month (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const violationsByMonth = await prisma.$queryRaw<
      Array<{ month: string; count: bigint }>
    >`
      SELECT 
        TO_CHAR(v."createdAt", 'Mon YYYY') as month,
        COUNT(*)::bigint as count
      FROM violations v
      WHERE v."createdAt" >= ${sixMonthsAgo}
      GROUP BY TO_CHAR(v."createdAt", 'Mon YYYY'), DATE_TRUNC('month', v."createdAt")
      ORDER BY DATE_TRUNC('month', v."createdAt") ASC
    `;

    // Fines by status
    const finesByStatus = await prisma.fine.groupBy({
      by: ["status"],
      _count: {
        id: true,
      },
      _sum: {
        amount: true,
      },
    });

    // Violation types breakdown
    const violationsByType = await prisma.$queryRaw<
      Array<{ type: string; count: bigint }>
    >`
      SELECT 
        r.title as type,
        COUNT(*)::bigint as count
      FROM violations v
      INNER JOIN rules r ON v."ruleId" = r.id
      WHERE v."createdAt" >= ${sixMonthsAgo}
      GROUP BY r.title
      ORDER BY count DESC
      LIMIT 10
    `;

    // Citizen reports by status
    const reportsByStatus = await prisma.citizenReport.groupBy({
      by: ["status"],
      _count: {
        id: true,
      },
    });

    const analytics = {
      violationsByMonth: violationsByMonth.map((v) => ({
        month: v.month,
        count: Number(v.count),
      })),
      finesByStatus: finesByStatus.map((f) => ({
        status: f.status,
        count: f._count.id,
        totalAmount: f._sum.amount || 0,
      })),
      violationsByType: violationsByType.map((v) => ({
        type: v.type,
        count: Number(v.count),
      })),
      reportsByStatus: reportsByStatus.map((r) => ({
        status: r.status,
        count: r._count.id,
      })),
    };

    console.log("\n====== BACKEND: SENDING POLICE ANALYTICS ======");
    console.log("User ID:", userId);
    console.log("📊 Violations by month:", analytics.violationsByMonth.length);
    console.log("💰 Fines by status:", analytics.finesByStatus.length);
    console.log("🏷️ Violation types:", analytics.violationsByType.length);
    console.log("================================================\n");

    return res.status(200).json({
      success: true,
      data: analytics,
      statusCode: 200,
    });
  } catch (error) {
    console.error("Error fetching police analytics:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch analytics",
      statusCode: 500,
    });
  }
};
