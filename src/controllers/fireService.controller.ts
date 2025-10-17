import { Response } from "express";
import { AuthRequest } from "../types/auth";
import { prisma } from "../lib/prisma";

/**
 * Get fire service dashboard statistics
 * @route GET /api/fire-service/stats
 */
export const getFireServiceStats = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated",
        statusCode: 401,
      });
    }

    // Get emergency/accident reports
    const totalEmergencies = await prisma.accident.count();

    const activeEmergencies = await prisma.accident.count({
      where: {
        status: { in: ["PENDING", "IN_PROGRESS"] },
      },
    });

    const resolvedEmergencies = await prisma.accident.count({
      where: {
        status: "RESOLVED",
      },
    });

    // Get recent accidents/emergencies
    const recentEmergencies = await prisma.accident.findMany({
      include: {
        location: {
          select: {
            area: true,
            district: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 10,
    });

    const stats = {
      totalEmergencies,
      activeEmergencies,
      resolvedEmergencies,
      recentEmergencies: recentEmergencies.map((e) => ({
        id: e.id,
        location: `${e.location?.area || ""}, ${
          e.location?.district || ""
        }`.trim(),
        severity: e.severity,
        status: e.status,
        date: e.createdAt,
        description: e.description || "No description",
      })),
    };

    return res.status(200).json({
      success: true,
      data: stats,
      statusCode: 200,
    });
  } catch (error) {
    console.error("Error fetching fire service stats:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch statistics",
      statusCode: 500,
    });
  }
};

/**
 * Get fire service analytics for dashboard graphs
 * @route GET /api/fire-service/analytics
 */
export const getFireServiceAnalytics = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated",
        statusCode: 401,
      });
    }

    // Emergencies by month (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const emergenciesByMonth = await prisma.$queryRaw<
      Array<{ month: string; count: bigint }>
    >`
      SELECT 
        TO_CHAR(a."createdAt", 'Mon YYYY') as month,
        COUNT(*)::bigint as count
      FROM accidents a
      WHERE a."createdAt" >= ${sixMonthsAgo}
      GROUP BY TO_CHAR(a."createdAt", 'Mon YYYY'), DATE_TRUNC('month', a."createdAt")
      ORDER BY DATE_TRUNC('month', a."createdAt") ASC
    `;

    // Emergencies by severity
    const emergenciesBySeverity = await prisma.accident.groupBy({
      by: ["severity"],
      _count: {
        id: true,
      },
    });

    // Emergencies by status
    const emergenciesByStatus = await prisma.accident.groupBy({
      by: ["status"],
      _count: {
        id: true,
      },
    });

    const analytics = {
      emergenciesByMonth: emergenciesByMonth.map((e) => ({
        month: e.month,
        count: Number(e.count),
      })),
      emergenciesBySeverity: emergenciesBySeverity.map((e) => ({
        severity: e.severity,
        count: e._count.id,
      })),
      emergenciesByStatus: emergenciesByStatus.map((e) => ({
        status: e.status,
        count: e._count.id,
      })),
    };

    console.log("\n====== BACKEND: SENDING FIRE SERVICE ANALYTICS ======");
    console.log("User ID:", userId);
    console.log(
      "🔥 Emergencies by month:",
      analytics.emergenciesByMonth.length
    );
    console.log("📊 By severity:", analytics.emergenciesBySeverity.length);
    console.log("📈 By status:", analytics.emergenciesByStatus.length);
    console.log("====================================================\n");

    return res.status(200).json({
      success: true,
      data: analytics,
      statusCode: 200,
    });
  } catch (error) {
    console.error("Error fetching fire service analytics:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch analytics",
      statusCode: 500,
    });
  }
};
