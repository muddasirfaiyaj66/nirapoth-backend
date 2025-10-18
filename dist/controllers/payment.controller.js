import { z } from "zod";
import { sslCommerzService } from "../services/sslcommerz.service";
import { prisma } from "../lib/prisma";
// Simple in-memory cache for user payments (60 seconds TTL)
const paymentCache = new Map();
const CACHE_TTL = 60 * 1000; // 60 seconds
function getCachedPayments(userId) {
    const cached = paymentCache.get(userId);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        console.log(`✨ Using cached payments for user: ${userId}`);
        return cached.data;
    }
    return null;
}
function setCachedPayments(userId, data) {
    paymentCache.set(userId, { data, timestamp: Date.now() });
}
function clearCachedPayments(userId) {
    paymentCache.delete(userId);
}
// Validation schemas
const createPaymentSchema = z.object({
    fineId: z.string().uuid("Invalid fine ID"),
    amount: z.number().min(1, "Amount must be positive"),
    paymentMethod: z.enum(["CARD", "BANK_TRANSFER", "MOBILE_MONEY", "ONLINE"]),
    transactionId: z.string().optional(),
});
const initOnlinePaymentSchema = z
    .object({
    fineId: z.string().uuid("Invalid fine ID").optional(),
    fineIds: z.array(z.string().uuid()).optional(),
    debtId: z.string().uuid("Invalid debt ID").optional(),
    amount: z.number().min(1, "Amount must be positive"),
})
    .refine((data) => data.fineId || (data.fineIds && data.fineIds.length > 0) || data.debtId, {
    message: "Either fineId, fineIds, or debtId must be provided",
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
    static async getAllPayments(req, res) {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            const search = req.query.search;
            const status = req.query.status;
            const method = req.query.method;
            const skip = (page - 1) * limit;
            // Build where clause
            const where = {};
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
        }
        catch (error) {
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
    static async getPaymentById(req, res) {
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
        }
        catch (error) {
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
    static async createPayment(req, res) {
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
            // Clear cache for this user
            clearCachedPayments(userId);
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
        }
        catch (error) {
            console.error("Error creating payment:", error);
            if (error instanceof z.ZodError) {
                res.status(400).json({
                    success: false,
                    message: "Validation error",
                    errors: error.issues,
                    statusCode: 400,
                });
            }
            else {
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
    static async updatePaymentStatus(req, res) {
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
            // Clear cache for this user
            clearCachedPayments(updatedPayment.userId);
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
        }
        catch (error) {
            console.error("Error updating payment status:", error);
            if (error instanceof z.ZodError) {
                res.status(400).json({
                    success: false,
                    message: "Validation error",
                    errors: error.issues,
                    statusCode: 400,
                });
            }
            else {
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
    static async getUserPayments(req, res) {
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
            // Check cache first
            const cachedPayments = getCachedPayments(userId);
            if (cachedPayments) {
                res.status(200).json({
                    success: true,
                    data: cachedPayments,
                    statusCode: 200,
                    cached: true,
                });
                return;
            }
            console.log(`🔍 Fetching payments from DB for user: ${userId}`);
            const startTime = Date.now();
            const payments = await prisma.payment.findMany({
                where: { userId },
                orderBy: { createdAt: "desc" }, // Changed from paidAt to createdAt for better performance
                take: 100, // Limit to 100 most recent payments
                include: {
                    fine: {
                        include: {
                            violation: {
                                include: {
                                    rule: {
                                        select: {
                                            id: true,
                                            title: true,
                                            description: true,
                                        },
                                    },
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
            const endTime = Date.now();
            console.log(`✅ Fetched ${payments.length} payments in ${endTime - startTime}ms`);
            // Cache the results
            setCachedPayments(userId, payments);
            res.status(200).json({
                success: true,
                data: payments,
                statusCode: 200,
                cached: false,
            });
            console.log(`✅ Fetched ${payments.length} payments in ${endTime - startTime}ms`);
            res.status(200).json({
                success: true,
                data: payments,
                statusCode: 200,
            });
        }
        catch (error) {
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
    static async getPaymentStats(req, res) {
        try {
            const [totalPayments, completedPayments, pendingPayments, failedPayments, refundedPayments,] = await Promise.all([
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
        }
        catch (error) {
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
    static async getUserUnpaidFines(req, res) {
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
        }
        catch (error) {
            console.error("Error fetching user unpaid fines:", error);
            res.status(500).json({
                success: false,
                message: "Internal server error",
                statusCode: 500,
            });
        }
    }
    /**
     * Initialize online payment with SSLCommerz
     */
    static async initOnlinePayment(req, res) {
        try {
            const validatedData = initOnlinePaymentSchema.parse(req.body);
            const userId = req.user?.id;
            if (!userId) {
                res.status(401).json({
                    success: false,
                    message: "User not authenticated",
                    statusCode: 401,
                });
                return;
            }
            // Use backend base URL for gateway callbacks
            const baseURL = process.env.BACKEND_URL || "http://localhost:5000";
            let result;
            // Handle debt payment
            if (validatedData.debtId) {
                result = await sslCommerzService.createDebtPaymentSession(validatedData.debtId, userId, validatedData.amount, baseURL);
            }
            // Handle single fine payment
            else if (validatedData.fineId) {
                result = await sslCommerzService.createFinePaymentSession(validatedData.fineId, userId, validatedData.amount, baseURL);
            }
            // Handle multiple fines payment
            else if (validatedData.fineIds) {
                result = await sslCommerzService.createMultipleFinesPaymentSession(validatedData.fineIds, userId, baseURL);
            }
            if (result?.success) {
                res.status(200).json({
                    success: true,
                    message: "Payment session created successfully",
                    data: {
                        gatewayPageURL: result.gatewayPageURL,
                        sessionKey: result.sessionKey,
                        transactionId: result.transactionId,
                    },
                    statusCode: 200,
                });
            }
            else {
                res.status(400).json({
                    success: false,
                    message: result?.message || "Failed to initialize payment",
                    statusCode: 400,
                });
            }
        }
        catch (error) {
            console.error("Error initializing online payment:", error);
            if (error instanceof z.ZodError) {
                res.status(400).json({
                    success: false,
                    message: "Validation error",
                    errors: error.issues,
                    statusCode: 400,
                });
            }
            else {
                res.status(500).json({
                    success: false,
                    message: "Internal server error",
                    statusCode: 500,
                });
            }
        }
    }
    /**
     * Handle SSLCommerz success callback
     */
    static async handleSSLSuccess(req, res) {
        try {
            const result = await sslCommerzService.handleSuccessCallback(req.body);
            if (result.success) {
                // Redirect to frontend success page
                const frontendURL = process.env.FRONTEND_URL || "http://localhost:3000";
                const url = new URL(`/payment/success`, frontendURL);
                url.searchParams.set("transactionId", req.body.tran_id || "");
                // Preserve context for debt payments
                if (result.paymentType === "DEBT" && result.debt?.id) {
                    url.searchParams.set("type", "debt");
                    url.searchParams.set("debtId", result.debt.id);
                }
                res.redirect(url.toString());
            }
            else {
                const frontendURL = process.env.FRONTEND_URL || "http://localhost:3000";
                const url = new URL(`/payment/failed`, frontendURL);
                url.searchParams.set("message", result.message || "Payment failed");
                res.redirect(url.toString());
            }
        }
        catch (error) {
            console.error("Error handling SSLCommerz success:", error);
            const frontendURL = process.env.FRONTEND_URL || "http://localhost:3000";
            const url = new URL(`/payment/failed`, frontendURL);
            url.searchParams.set("message", "Payment processing error");
            res.redirect(url.toString());
        }
    }
    /**
     * Handle SSLCommerz fail callback
     */
    static async handleSSLFail(req, res) {
        try {
            await sslCommerzService.handleFailCallback(req.body);
            const frontendURL = process.env.FRONTEND_URL || "http://localhost:3000";
            const url = new URL(`/payment/failed`, frontendURL);
            url.searchParams.set("message", "Payment failed");
            res.redirect(url.toString());
        }
        catch (error) {
            console.error("Error handling SSLCommerz fail:", error);
            const frontendURL = process.env.FRONTEND_URL || "http://localhost:3000";
            const url = new URL(`/payment/failed`, frontendURL);
            url.searchParams.set("message", "Payment processing error");
            res.redirect(url.toString());
        }
    }
    /**
     * Handle SSLCommerz cancel callback
     */
    static async handleSSLCancel(req, res) {
        try {
            await sslCommerzService.handleCancelCallback(req.body);
            const frontendURL = process.env.FRONTEND_URL || "http://localhost:3000";
            const url = new URL(`/payment/cancelled`, frontendURL);
            res.redirect(url.toString());
        }
        catch (error) {
            console.error("Error handling SSLCommerz cancel:", error);
            const frontendURL = process.env.FRONTEND_URL || "http://localhost:3000";
            const url = new URL(`/payment/cancelled`, frontendURL);
            res.redirect(url.toString());
        }
    }
    /**
     * Handle SSLCommerz IPN (Instant Payment Notification) callback
     */
    static async handleSSLIPN(req, res) {
        try {
            const result = await sslCommerzService.handleSuccessCallback(req.body);
            if (result.success) {
                res.status(200).json({
                    success: true,
                    message: "IPN processed successfully",
                });
            }
            else {
                res.status(400).json({
                    success: false,
                    message: result.message,
                });
            }
        }
        catch (error) {
            console.error("Error handling SSLCommerz IPN:", error);
            res.status(500).json({
                success: false,
                message: "IPN processing error",
            });
        }
    }
    /**
     * Query transaction status
     */
    static async queryTransaction(req, res) {
        try {
            const { transactionId } = req.params;
            const result = await sslCommerzService.queryTransaction(transactionId);
            res.status(200).json({
                success: true,
                data: result.data,
                statusCode: 200,
            });
        }
        catch (error) {
            console.error("Error querying transaction:", error);
            res.status(500).json({
                success: false,
                message: "Internal server error",
                statusCode: 500,
            });
        }
    }
    /**
     * Verify a transaction against our database (authoritative)
     * @route GET /api/payments/verify/:transactionId
     */
    static async verifyTransaction(req, res) {
        try {
            const { transactionId } = req.params;
            const userId = req.user?.id;
            if (!userId) {
                res.status(401).json({
                    success: false,
                    message: "User not authenticated",
                    statusCode: 401,
                });
                return;
            }
            // Find payment for this user by merchant transaction id
            const payment = await prisma.payment.findFirst({
                where: {
                    transactionId,
                    userId,
                },
                include: {
                    fine: true,
                },
            });
            if (!payment) {
                res.status(200).json({
                    success: true,
                    data: { verified: false, reason: "NOT_FOUND" },
                    statusCode: 200,
                });
                return;
            }
            const paymentStatus = payment.paymentStatus;
            const fineStatus = payment.fine?.status;
            const verified = paymentStatus === "COMPLETED" || fineStatus === "PAID";
            res.status(200).json({
                success: true,
                data: {
                    verified,
                    paymentStatus,
                    fineStatus: fineStatus || null,
                },
                statusCode: 200,
            });
        }
        catch (error) {
            console.error("Error verifying transaction:", error);
            res.status(500).json({
                success: false,
                message: "Internal server error",
                statusCode: 500,
            });
        }
    }
    /**
     * Initiate refund
     */
    static async initiateRefund(req, res) {
        try {
            const { paymentId } = req.params;
            const { refundAmount, refundRemarks } = req.body;
            // Find payment
            const payment = await prisma.payment.findUnique({
                where: { id: paymentId },
            });
            if (!payment) {
                res.status(404).json({
                    success: false,
                    message: "Payment not found",
                    statusCode: 404,
                });
                return;
            }
            if (payment.paymentStatus !== "COMPLETED") {
                res.status(400).json({
                    success: false,
                    message: "Can only refund completed payments",
                    statusCode: 400,
                });
                return;
            }
            if (!payment.transactionId) {
                res.status(400).json({
                    success: false,
                    message: "Transaction ID not found",
                    statusCode: 400,
                });
                return;
            }
            const result = await sslCommerzService.initiateRefund(payment.transactionId, refundAmount || payment.amount, refundRemarks || "Refund requested");
            if (result.success) {
                // Update payment status
                await prisma.payment.update({
                    where: { id: paymentId },
                    data: {
                        paymentStatus: "REFUNDED",
                    },
                });
                res.status(200).json({
                    success: true,
                    message: "Refund initiated successfully",
                    data: result.data,
                    statusCode: 200,
                });
            }
            else {
                res.status(400).json({
                    success: false,
                    message: result.message,
                    statusCode: 400,
                });
            }
        }
        catch (error) {
            console.error("Error initiating refund:", error);
            res.status(500).json({
                success: false,
                message: "Internal server error",
                statusCode: 500,
            });
        }
    }
    /**
     * Process debt payment after SSLCommerz success callback
     * Called from frontend payment callback route
     */
    static async processDebtPayment(req, res) {
        try {
            const { debtId, transactionId, amount, valId } = req.body;
            console.log("💳 Processing debt payment:", {
                debtId,
                transactionId,
                amount,
                valId,
            });
            if (!debtId || !transactionId) {
                res.status(400).json({
                    success: false,
                    message: "Missing required fields: debtId, transactionId",
                    statusCode: 400,
                });
                return;
            }
            // Import debt management service
            const { DebtManagementService } = await import("../services/debtManagement.service");
            // Get the debt
            const debt = await DebtManagementService.getDebtById(debtId);
            if (!debt) {
                res.status(404).json({
                    success: false,
                    message: "Debt not found",
                    statusCode: 404,
                });
                return;
            }
            // Check if debt is already paid
            if (debt.status === "PAID") {
                console.log("⚠️ Debt already paid, skipping processing");
                res.status(200).json({
                    success: true,
                    message: "Debt already paid",
                    data: debt,
                    statusCode: 200,
                });
                return;
            }
            // Calculate payment amount - use provided amount or remaining debt amount
            const remainingDebt = debt.currentAmount - debt.paidAmount;
            const paymentAmount = amount ? parseFloat(amount) : remainingDebt;
            console.log("💰 Payment calculation:", {
                providedAmount: amount,
                remainingDebt,
                paymentAmount,
            });
            // Record the payment (clamp to remaining amount to avoid negatives)
            const safePaymentAmount = Math.max(0, Math.min(paymentAmount, remainingDebt));
            const updatedDebt = await DebtManagementService.recordPayment(debtId, safePaymentAmount, transactionId);
            console.log("✅ Debt payment recorded successfully:", {
                debtId: updatedDebt.id,
                status: updatedDebt.status,
                paidAmount: updatedDebt.paidAmount,
                currentAmount: updatedDebt.currentAmount,
            });
            // Create a DEBT_PAYMENT transaction to record the payment
            // This is separate from rewards - it's a payment that reduces debt
            await prisma.rewardTransaction.create({
                data: {
                    userId: debt.userId,
                    amount: safePaymentAmount, // Positive value (industry standard)
                    type: "DEBT_PAYMENT",
                    source: "DEBT_PAYMENT",
                    status: "COMPLETED",
                    description: `Debt payment - ${transactionId}`,
                },
            });
            // Create a balancing credit so rewards-offset cancels penalties
            // This ensures currentBalance = rewards - penalties reaches zero after full payment
            await prisma.rewardTransaction.create({
                data: {
                    userId: debt.userId,
                    amount: safePaymentAmount, // credit amount
                    type: "REWARD",
                    source: "DEBT_PAYMENT",
                    status: "COMPLETED",
                    description: `Debt payment credit - ${transactionId}`,
                },
            });
            console.log("💰 Created debt payment transaction:", {
                amount: paymentAmount,
                type: "DEBT_PAYMENT",
                transactionId,
            });
            // If debt is now fully paid, check if there are any remaining balance issues
            if (updatedDebt.status === "PAID") {
                console.log("✅ Debt fully paid, checking for any remaining balance issues");
                // This will recalculate and create new debt only if balance is still negative
                // But now the balance should be positive because we added the reward transaction
                await DebtManagementService.checkAndCreateDebtForNegativeBalance(debt.userId);
            }
            // Send debt payment confirmation email (non-blocking)
            try {
                const { EmailService } = await import("../services/email.service");
                const emailService = new EmailService();
                const remaining = Math.max(0, (updatedDebt.currentAmount || 0) - (updatedDebt.paidAmount || 0));
                await emailService.sendDebtPaymentConfirmation({
                    userEmail: debt.user?.email || "",
                    userName: `${debt.user?.firstName || ""} ${debt.user?.lastName || ""}`.trim(),
                    transactionId,
                    amount: safePaymentAmount,
                    paymentMethod: "Online Payment",
                    debtId,
                    remainingBalance: remaining,
                    paymentDate: new Date().toISOString(),
                });
            }
            catch (emailError) {
                console.error("Failed to send debt payment email:", emailError);
            }
            res.status(200).json({
                success: true,
                message: "Debt payment processed successfully",
                data: updatedDebt,
                statusCode: 200,
            });
        }
        catch (error) {
            console.error("❌ Error processing debt payment:", error);
            res.status(500).json({
                success: false,
                message: error.message || "Internal server error",
                statusCode: 500,
            });
        }
    }
}
