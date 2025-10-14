import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { z } from "zod";
import { AuthRequest } from "../types/auth";

const prisma = new PrismaClient();

// Validation schemas
const createPaymentSchema = z.object({
  fineId: z.string().uuid("Invalid fine ID"),
  amount: z.number().min(1, "Amount must be positive"),
  paymentMethod: z.enum([
    "CASH",
    "CARD",
    "BANK_TRANSFER",
    "MOBILE_MONEY",
    "ONLINE",
  ]),
  transactionId: z.string().optional(),
});

const updatePaymentStatusSchema = z.object({
  paymentId: z.string().uuid("Invalid payment ID"),
  status: z.enum(["PENDING", "COMPLETED", "FAILED", "REFUNDED"]),
  notes: z.string().optional(),
});

export class PaymentController {
  /**
   * Get all payments with pagination and filtering
   */
  static async getAllPayments(req: AuthRequest, res: Response): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const search = req.query.search as string;
      const status = req.query.status as string;
      const method = req.query.method as string;

      const skip = (page - 1) * limit;

      // Build where clause
      const where: any = {};

      // Search filter
      if (search) {
        where.OR = [
          { transactionId: { contains: search, mode: "insensitive" } },
          {
            user: {
              OR: [
                { firstName: { contains: search, mode: "insensitive" } },
                { lastName: { contains: search, mode: "insensitive" } },
                { email: { contains: search, mode: "insensitive" } },
              ],
            },
          },
          {
            fine: {
              violation: {
                vehicle: {
                  plateNo: { contains: search, mode: "insensitive" },
                },
              },
            },
          },
        ];
      }

      // Status filter
      if (status && status !== "all") {
        where.paymentStatus = status;
      }

      // Method filter
      if (method && method !== "all") {
        where.paymentMethod = method;
      }

      // Get payments and total count
      const [payments, total] = await Promise.all([
        prisma.payment.findMany({
          where,
          skip,
          take: limit,
          orderBy: { paidAt: "desc" },
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
            fine: {
              include: {
                violation: {
                  include: {
                    rule: true,
                    vehicle: {
                      select: {
                        plateNo: true,
                        brand: true,
                        model: true,
                      },
                    },
                  },
                },
              },
            },
          },
        }),
        prisma.payment.count({ where }),
      ]);

      res.status(200).json({
        success: true,
        data: {
          payments,
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
        statusCode: 200,
      });
    } catch (error) {
      console.error("Error fetching payments:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        statusCode: 500,
      });
    }
  }

  /**
   * Get payment by ID
   */
  static async getPaymentById(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { paymentId } = req.params;

      const payment = await prisma.payment.findUnique({
        where: { id: paymentId },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          fine: {
            include: {
              violation: {
                include: {
                  rule: true,
                  vehicle: {
                    select: {
                      plateNo: true,
                      brand: true,
                      model: true,
                    },
                  },
                },
              },
            },
          },
        },
      });

      if (!payment) {
        res.status(404).json({
          success: false,
          message: "Payment not found",
          statusCode: 404,
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: payment,
        statusCode: 200,
      });
    } catch (error) {
      console.error("Error fetching payment:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        statusCode: 500,
      });
    }
  }

  /**
   * Create new payment
   */
  static async createPayment(req: AuthRequest, res: Response): Promise<void> {
    try {
      const validatedData = createPaymentSchema.parse(req.body);
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: "User not authenticated",
          statusCode: 401,
        });
        return;
      }

      // Check if fine exists and belongs to user
      const fine = await prisma.fine.findUnique({
        where: { id: validatedData.fineId },
        include: {
          violation: {
            include: {
              vehicle: true,
            },
          },
        },
      });

      if (!fine) {
        res.status(404).json({
          success: false,
          message: "Fine not found",
          statusCode: 404,
        });
        return;
      }

      // Check if fine belongs to user (through vehicle ownership)
      const isOwner = fine.violation.vehicle.ownerId === userId;
      const isDriver = fine.violation.vehicle.driverId === userId;

      if (!isOwner && !isDriver) {
        res.status(403).json({
          success: false,
          message: "You are not authorized to pay this fine",
          statusCode: 403,
        });
        return;
      }

      // Check if fine is already paid
      if (fine.status === "PAID") {
        res.status(400).json({
          success: false,
          message: "Fine is already paid",
          statusCode: 400,
        });
        return;
      }

      // Check if payment amount matches fine amount
      if (validatedData.amount !== fine.amount) {
        res.status(400).json({
          success: false,
          message: "Payment amount does not match fine amount",
          statusCode: 400,
        });
        return;
      }

      // Create payment
      const payment = await prisma.payment.create({
        data: {
          userId,
          fineId: validatedData.fineId,
          amount: validatedData.amount,
          paymentMethod: validatedData.paymentMethod,
          transactionId: validatedData.transactionId,
          paymentStatus: "COMPLETED",
          paidAt: new Date(),
        },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          fine: {
            include: {
              violation: {
                include: {
                  rule: true,
                  vehicle: {
                    select: {
                      plateNo: true,
                      brand: true,
                      model: true,
                    },
                  },
                },
              },
            },
          },
        },
      });

      // Update fine status
      await prisma.fine.update({
        where: { id: validatedData.fineId },
        data: {
          status: "PAID",
          paidAt: new Date(),
        },
      });

      res.status(201).json({
        success: true,
        message: "Payment created successfully",
        data: payment,
        statusCode: 201,
      });
    } catch (error) {
      console.error("Error creating payment:", error);
      if (error instanceof z.ZodError) {
        res.status(400).json({
          success: false,
          message: "Validation error",
          errors: error.issues,
          statusCode: 400,
        });
      } else {
        res.status(500).json({
          success: false,
          message: "Internal server error",
          statusCode: 500,
        });
      }
    }
  }

  /**
   * Update payment status
   */
  static async updatePaymentStatus(
    req: AuthRequest,
    res: Response
  ): Promise<void> {
    try {
      const validatedData = updatePaymentStatusSchema.parse(req.body);

      // Check if payment exists
      const payment = await prisma.payment.findUnique({
        where: { id: validatedData.paymentId },
      });

      if (!payment) {
        res.status(404).json({
          success: false,
          message: "Payment not found",
          statusCode: 404,
        });
        return;
      }

      // Update payment
      const updatedPayment = await prisma.payment.update({
        where: { id: validatedData.paymentId },
        data: {
          paymentStatus: validatedData.status,
        },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          fine: {
            include: {
              violation: {
                include: {
                  rule: true,
                  vehicle: {
                    select: {
                      plateNo: true,
                      brand: true,
                      model: true,
                    },
                  },
                },
              },
            },
          },
        },
      });

      // If payment is completed, update fine status
      if (validatedData.status === "COMPLETED") {
        await prisma.fine.update({
          where: { id: payment.fineId },
          data: {
            status: "PAID",
            paidAt: new Date(),
          },
        });
      }

      res.status(200).json({
        success: true,
        message: "Payment status updated successfully",
        data: updatedPayment,
        statusCode: 200,
      });
    } catch (error) {
      console.error("Error updating payment status:", error);
      if (error instanceof z.ZodError) {
        res.status(400).json({
          success: false,
          message: "Validation error",
          errors: error.issues,
          statusCode: 400,
        });
      } else {
        res.status(500).json({
          success: false,
          message: "Internal server error",
          statusCode: 500,
        });
      }
    }
  }

  /**
   * Get user's payments
   */
  static async getUserPayments(req: AuthRequest, res: Response): Promise<void> {
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

      const payments = await prisma.payment.findMany({
        where: { userId },
        orderBy: { paidAt: "desc" },
        include: {
          fine: {
            include: {
              violation: {
                include: {
                  rule: true,
                  vehicle: {
                    select: {
                      plateNo: true,
                      brand: true,
                      model: true,
                    },
                  },
                },
              },
            },
          },
        },
      });

      res.status(200).json({
        success: true,
        data: payments,
        statusCode: 200,
      });
    } catch (error) {
      console.error("Error fetching user payments:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        statusCode: 500,
      });
    }
  }

  /**
   * Get payment statistics
   */
  static async getPaymentStats(req: AuthRequest, res: Response): Promise<void> {
    try {
      const [
        totalPayments,
        completedPayments,
        pendingPayments,
        failedPayments,
        refundedPayments,
      ] = await Promise.all([
        prisma.payment.count(),
        prisma.payment.count({ where: { paymentStatus: "COMPLETED" } }),
        prisma.payment.count({ where: { paymentStatus: "PENDING" } }),
        prisma.payment.count({ where: { paymentStatus: "FAILED" } }),
        prisma.payment.count({ where: { paymentStatus: "REFUNDED" } }),
      ]);

      // Calculate total revenue
      const revenueResult = await prisma.payment.aggregate({
        _sum: { amount: true },
        where: { paymentStatus: "COMPLETED" },
      });
      const totalRevenue = revenueResult._sum.amount || 0;

      // Get payment method distribution
      const paymentMethodStats = await prisma.payment.groupBy({
        by: ["paymentMethod"],
        _count: { id: true },
        _sum: { amount: true },
        where: { paymentStatus: "COMPLETED" },
      });

      res.status(200).json({
        success: true,
        data: {
          totalPayments,
          completedPayments,
          pendingPayments,
          failedPayments,
          refundedPayments,
          totalRevenue,
          paymentMethodStats,
        },
        statusCode: 200,
      });
    } catch (error) {
      console.error("Error fetching payment stats:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        statusCode: 500,
      });
    }
  }

  /**
   * Get user's unpaid fines
   */
  static async getUserUnpaidFines(
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

      // Get user's vehicles
      const userVehicles = await prisma.vehicle.findMany({
        where: {
          OR: [{ ownerId: userId }, { driverId: userId }],
        },
        select: { id: true },
      });

      const vehicleIds = userVehicles.map((v) => v.id);

      // Get unpaid fines for user's vehicles
      const unpaidFines = await prisma.fine.findMany({
        where: {
          status: "UNPAID",
          violation: {
            vehicleId: { in: vehicleIds },
          },
        },
        include: {
          violation: {
            include: {
              rule: true,
              vehicle: {
                select: {
                  plateNo: true,
                  brand: true,
                  model: true,
                },
              },
            },
          },
        },
        orderBy: { issuedAt: "desc" },
      });

      res.status(200).json({
        success: true,
        data: unpaidFines,
        statusCode: 200,
      });
    } catch (error) {
      console.error("Error fetching user unpaid fines:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        statusCode: 500,
      });
    }
  }
}
