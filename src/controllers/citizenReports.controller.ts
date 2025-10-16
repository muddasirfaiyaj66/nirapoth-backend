import { Response } from "express";
import { PrismaClient } from "@prisma/client";
import { AuthRequest } from "../types/auth";

const prisma = new PrismaClient();

export class CitizenReportsController {
  // Get my reports (for citizens)
  static async getMyReports(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const search = (req.query.search as string) || "";
      const status = (req.query.status as string) || "all";

      const skip = (page - 1) * limit;

      const where: any = {
        citizenId: userId,
      };

      if (search) {
        where.vehiclePlate = {
          contains: search,
          mode: "insensitive",
        };
      }

      if (status !== "all") {
        where.status = status;
      }

      const [reports, total] = await Promise.all([
        prisma.citizenReport.findMany({
          where,
          include: {
            location: true,
          },
          skip,
          take: limit,
          orderBy: { createdAt: "desc" },
        }),
        prisma.citizenReport.count({ where }),
      ]);

      res.status(200).json({
        success: true,
        data: {
          reports,
          total,
          page,
          limit,
          pages: Math.ceil(total / limit),
        },
      });
    } catch (error) {
      console.error("Error fetching my reports:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch reports",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  // Get my stats (for citizens)
  static async getMyStats(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;

      const allReports = await prisma.citizenReport.findMany({
        where: { citizenId: userId },
        select: {
          status: true,
          rewardAmount: true,
          penaltyAmount: true,
        },
      });

      const totalReports = allReports.length;
      const pendingReports = allReports.filter(
        (r) => r.status === "PENDING"
      ).length;
      const approvedReports = allReports.filter(
        (r) => r.status === "APPROVED"
      ).length;
      const rejectedReports = allReports.filter(
        (r) => r.status === "REJECTED"
      ).length;

      const approvalRate =
        totalReports > 0 ? (approvedReports / totalReports) * 100 : 0;

      const totalRewardsEarned = allReports
        .filter((r) => r.status === "APPROVED")
        .reduce((sum, r) => sum + (r.rewardAmount || 0), 0);

      const totalPenaltiesPaid = allReports
        .filter((r) => r.status === "REJECTED")
        .reduce((sum, r) => sum + (r.penaltyAmount || 0), 0);

      res.status(200).json({
        success: true,
        data: {
          totalReports,
          pendingReports,
          approvedReports,
          rejectedReports,
          approvalRate,
          totalRewardsEarned,
          totalPenaltiesPaid,
        },
      });
    } catch (error) {
      console.error("Error fetching my stats:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch stats",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  // Get pending reports (for police)
  static async getPendingReports(
    req: AuthRequest,
    res: Response
  ): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const search = (req.query.search as string) || "";
      const status = (req.query.status as string) || "PENDING";

      const skip = (page - 1) * limit;

      const where: any = {
        status: status,
      };

      if (search) {
        where.vehiclePlate = {
          contains: search,
          mode: "insensitive",
        };
      }

      const [reports, total] = await Promise.all([
        prisma.citizenReport.findMany({
          where,
          include: {
            location: true,
            citizen: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
          skip,
          take: limit,
          orderBy: { createdAt: "desc" },
        }),
        prisma.citizenReport.count({ where }),
      ]);

      res.status(200).json({
        success: true,
        data: {
          reports,
          total,
          page,
          limit,
          pages: Math.ceil(total / limit),
        },
      });
    } catch (error) {
      console.error("Error fetching pending reports:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch pending reports",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  // Get review statistics (for police)
  static async getReviewStats(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;

      // Get total pending reports
      const pendingCount = await prisma.citizenReport.count({
        where: { status: "PENDING" },
      });

      // Get reports reviewed today by this officer
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const reviewedToday = await prisma.citizenReport.count({
        where: {
          reviewedBy: userId,
          reviewedAt: {
            gte: today,
          },
        },
      });

      // Calculate overall approval rate
      const totalReviewed = await prisma.citizenReport.count({
        where: {
          status: {
            in: ["APPROVED", "REJECTED"],
          },
        },
      });

      const approvedCount = await prisma.citizenReport.count({
        where: { status: "APPROVED" },
      });

      const approvalRate =
        totalReviewed > 0
          ? Math.round((approvedCount / totalReviewed) * 100)
          : 0;

      // Calculate average review time (in minutes)
      const reviewedReports = await prisma.citizenReport.findMany({
        where: {
          status: {
            in: ["APPROVED", "REJECTED"],
          },
          reviewedAt: {
            not: null,
          },
        },
        select: {
          createdAt: true,
          reviewedAt: true,
        },
        take: 100, // Last 100 reviewed reports
      });

      let avgReviewTime = 0;
      if (reviewedReports.length > 0) {
        const totalMinutes = reviewedReports.reduce((sum, report) => {
          if (report.reviewedAt) {
            const diffMs =
              new Date(report.reviewedAt).getTime() -
              new Date(report.createdAt).getTime();
            return sum + Math.floor(diffMs / 60000); // Convert to minutes
          }
          return sum;
        }, 0);
        avgReviewTime = Math.round(totalMinutes / reviewedReports.length);
      }

      res.status(200).json({
        success: true,
        data: {
          pendingCount,
          reviewedToday,
          approvalRate,
          avgReviewTime,
        },
      });
    } catch (error) {
      console.error("Error fetching review stats:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch review statistics",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  // Review report (approve/reject) - for police
  static async reviewReport(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { reportId } = req.params;
      const { action, reviewNotes } = req.body;
      const userId = req.user?.id;

      if (!["APPROVED", "REJECTED"].includes(action)) {
        res.status(400).json({
          success: false,
          message: "Invalid action. Must be APPROVED or REJECTED",
        });
        return;
      }

      // Find the report
      const report = await prisma.citizenReport.findUnique({
        where: { id: reportId },
      });

      if (!report) {
        res.status(404).json({
          success: false,
          message: "Report not found",
        });
        return;
      }

      if (report.status !== "PENDING") {
        res.status(400).json({
          success: false,
          message: "Report has already been reviewed",
        });
        return;
      }

      // Calculate reward or penalty (5% of standard fine amount)
      // You can adjust this calculation based on your business logic
      const standardFineAmount = 500; // Base fine amount in BDT
      const rewardPercentage = 0.05;
      const amount = standardFineAmount * rewardPercentage; // 25 BDT

      // Use a transaction to update report and create reward/penalty
      const result = await prisma.$transaction(async (tx) => {
        // Update the report
        const updatedReport = await tx.citizenReport.update({
          where: { id: reportId },
          data: {
            status: action,
            reviewNotes: reviewNotes || null,
            reviewedBy: userId,
            reviewedAt: new Date(),
            rewardAmount: action === "APPROVED" ? amount : null,
            penaltyAmount: action === "REJECTED" ? amount : null,
          },
          include: {
            location: true,
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

        // Create reward or penalty transaction
        await tx.rewardTransaction.create({
          data: {
            userId: report.citizenId,
            amount: action === "APPROVED" ? amount : -amount,
            type: action === "APPROVED" ? "REWARD" : "PENALTY",
            source: "CITIZEN_REPORT",
            description:
              action === "APPROVED"
                ? `Reward for approved report (${report.vehiclePlate})`
                : `Penalty for rejected report (${report.vehiclePlate})`,
            relatedReportId: reportId,
            status: "COMPLETED",
            processedAt: new Date(),
          },
        });

        return updatedReport;
      });

      res.status(200).json({
        success: true,
        message: `Report ${action.toLowerCase()} successfully`,
        data: result,
      });
    } catch (error) {
      console.error("Error reviewing report:", error);
      res.status(500).json({
        success: false,
        message: "Failed to review report",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  // Create a new citizen report
  static async createReport(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      const {
        vehiclePlate,
        violationType,
        description,
        evidenceUrls,
        locationData,
      } = req.body;

      // Validation
      if (!vehiclePlate || !violationType || !evidenceUrls || !locationData) {
        res.status(400).json({
          success: false,
          message:
            "Missing required fields: vehiclePlate, violationType, evidenceUrls, locationData",
        });
        return;
      }

      // Create location first
      const location = await prisma.location.create({
        data: {
          latitude: locationData.latitude,
          longitude: locationData.longitude,
          address: locationData.address || "",
          city: locationData.city,
          district: locationData.district,
          division: locationData.division,
          type: "VIOLATION", // LocationType enum value for citizen reports
        },
      });

      // Create the report
      const report = await prisma.citizenReport.create({
        data: {
          citizenId: userId!,
          vehiclePlate: vehiclePlate.toUpperCase(),
          violationType,
          description: description || null,
          evidenceUrl: evidenceUrls,
          locationId: location.id,
          status: "PENDING",
        },
        include: {
          location: true,
        },
      });

      res.status(201).json({
        success: true,
        message: "Report submitted successfully",
        data: report,
      });
    } catch (error) {
      console.error("Error creating report:", error);
      res.status(500).json({
        success: false,
        message: "Failed to create report",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  // Submit appeal for rejected report
  static async submitAppeal(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { reportId } = req.params;
      const userId = req.user?.id;
      const { appealReason, evidenceUrls } = req.body;

      // Validation
      if (!appealReason || !appealReason.trim()) {
        res.status(400).json({
          success: false,
          message: "Appeal reason is required",
        });
        return;
      }

      if (
        !evidenceUrls ||
        !Array.isArray(evidenceUrls) ||
        evidenceUrls.length === 0
      ) {
        res.status(400).json({
          success: false,
          message: "Evidence is required for appeals",
        });
        return;
      }

      // Find the report
      const report = await prisma.citizenReport.findUnique({
        where: { id: reportId },
      });

      if (!report) {
        res.status(404).json({
          success: false,
          message: "Report not found",
        });
        return;
      }

      // Check ownership
      if (report.citizenId !== userId) {
        res.status(403).json({
          success: false,
          message: "You can only appeal your own reports",
        });
        return;
      }

      // Check if report was rejected
      if (report.status !== "REJECTED") {
        res.status(400).json({
          success: false,
          message: "Only rejected reports can be appealed",
        });
        return;
      }

      // Check if already appealed
      if (report.appealSubmitted) {
        res.status(400).json({
          success: false,
          message:
            "This report has already been appealed. Appeals can only be submitted once.",
        });
        return;
      }

      // Update report with appeal information
      const updatedReport = await prisma.citizenReport.update({
        where: { id: reportId },
        data: {
          appealSubmitted: true,
          appealReason: appealReason.trim(),
          appealStatus: "PENDING",
          // Store evidence URLs in the description or create a new field
          evidenceUrl: [...(report.evidenceUrl || []), ...evidenceUrls],
        },
        include: {
          location: true,
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

      res.status(200).json({
        success: true,
        message:
          "Appeal submitted successfully. You will be notified of the decision within 7 days.",
        data: updatedReport,
      });
    } catch (error) {
      console.error("Error submitting appeal:", error);
      res.status(500).json({
        success: false,
        message: "Failed to submit appeal",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  // Delete a report (for citizens - only their own pending reports)
  static async deleteReport(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { reportId } = req.params;
      const userId = req.user?.id;

      // Find the report
      const report = await prisma.citizenReport.findUnique({
        where: { id: reportId },
      });

      if (!report) {
        res.status(404).json({
          success: false,
          message: "Report not found",
        });
        return;
      }

      // Check ownership
      if (report.citizenId !== userId) {
        res.status(403).json({
          success: false,
          message: "You can only delete your own reports",
        });
        return;
      }

      // Check if pending
      if (report.status !== "PENDING") {
        res.status(400).json({
          success: false,
          message: "You can only delete pending reports",
        });
        return;
      }

      // Delete the report
      await prisma.citizenReport.delete({
        where: { id: reportId },
      });

      res.status(200).json({
        success: true,
        message: "Report deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting report:", error);
      res.status(500).json({
        success: false,
        message: "Failed to delete report",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  // Get pending appeals (for police)
  static async getPendingAppeals(
    req: AuthRequest,
    res: Response
  ): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const skip = (page - 1) * limit;

      const where: any = {
        status: "REJECTED",
        appealSubmitted: true,
        appealStatus: "PENDING",
      };

      const [reports, total] = await Promise.all([
        prisma.citizenReport.findMany({
          where,
          include: {
            location: true,
            citizen: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                phone: true,
              },
            },
          },
          skip,
          take: limit,
          orderBy: { createdAt: "desc" },
        }),
        prisma.citizenReport.count({ where }),
      ]);

      res.status(200).json({
        success: true,
        data: {
          reports,
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
          },
        },
      });
    } catch (error) {
      console.error("Error fetching pending appeals:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch pending appeals",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  // Review appeal (for police)
  static async reviewAppeal(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { reportId } = req.params;
      const userId = req.user?.id;
      const { action, reviewNotes } = req.body;

      // Validation
      if (!action || !["APPROVED", "REJECTED"].includes(action)) {
        res.status(400).json({
          success: false,
          message: "Invalid action. Must be APPROVED or REJECTED",
        });
        return;
      }

      if (!reviewNotes || !reviewNotes.trim()) {
        res.status(400).json({
          success: false,
          message: "Review notes are required",
        });
        return;
      }

      // Find the report
      const report = await prisma.citizenReport.findUnique({
        where: { id: reportId },
      });

      if (!report) {
        res.status(404).json({
          success: false,
          message: "Report not found",
        });
        return;
      }

      // Check if it's an appeal
      if (!report.appealSubmitted || report.appealStatus !== "PENDING") {
        res.status(400).json({
          success: false,
          message: "This report does not have a pending appeal",
        });
        return;
      }

      // Calculate additional penalty if appeal is rejected (1.5% of original penalty)
      let additionalPenalty = 0;
      if (action === "REJECTED" && report.penaltyAmount) {
        additionalPenalty = report.penaltyAmount * 0.015;
      }

      // Update report with appeal decision
      const updatedData: any = {
        appealStatus: action,
        appealNotes: reviewNotes.trim(),
        appealReviewedBy: userId,
        appealReviewedAt: new Date(),
      };

      if (action === "APPROVED") {
        // If approved, waive the penalty
        updatedData.penaltyAmount = 0;
        updatedData.status = "APPROVED"; // Change status from REJECTED to APPROVED
      } else {
        // If rejected, add additional penalty
        updatedData.additionalPenaltyApplied = true;
        updatedData.additionalPenaltyAmount = additionalPenalty;
        updatedData.penaltyAmount =
          (report.penaltyAmount || 0) + additionalPenalty;
      }

      const updatedReport = await prisma.citizenReport.update({
        where: { id: reportId },
        data: updatedData,
        include: {
          location: true,
          citizen: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          appealReviewer: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      });

      const message =
        action === "APPROVED"
          ? "Appeal approved successfully. Penalty waived."
          : `Appeal rejected. Additional penalty of ${additionalPenalty.toFixed(
              2
            )} BDT applied.`;

      res.status(200).json({
        success: true,
        message,
        data: updatedReport,
      });
    } catch (error) {
      console.error("Error reviewing appeal:", error);
      res.status(500).json({
        success: false,
        message: "Failed to review appeal",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
}
