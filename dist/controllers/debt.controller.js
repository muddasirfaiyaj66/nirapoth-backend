import { DebtManagementService } from "../services/debtManagement.service";
import { z } from "zod";
// Validation schemas
const payDebtSchema = z.object({
    debtId: z.string().uuid(),
    amount: z.number().positive("Amount must be positive"),
    paymentMethod: z.enum(["CARD", "BANK_TRANSFER", "MOBILE_MONEY", "ONLINE"]),
    paymentReference: z.string().optional(),
});
/**
 * Get user's debt summary with all outstanding debts
 * GET /api/rewards/debts
 */
export const getMyDebts = async (req, res) => {
    try {
        if (!req.user?.id) {
            return res.status(401).json({ error: "Unauthorized" });
        }
        // Check and create debt if balance is negative
        await DebtManagementService.checkAndCreateDebtForNegativeBalance(req.user.id);
        const debts = await DebtManagementService.getUserDebts(req.user.id);
        const totalDebt = await DebtManagementService.getTotalDebtAmount(req.user.id);
        // Calculate total late fees
        const totalLateFees = debts.reduce((sum, debt) => sum + debt.lateFees, 0);
        // Get oldest debt's due date
        const oldestDebt = debts.length > 0
            ? debts.reduce((oldest, current) => new Date(current.dueDate) < new Date(oldest.dueDate)
                ? current
                : oldest)
            : null;
        return res.status(200).json({
            success: true,
            data: {
                debts,
                totalDebt,
                totalLateFees,
                debtCount: debts.length,
                oldestDueDate: oldestDebt?.dueDate || null,
            },
        });
    }
    catch (error) {
        console.error("Error fetching user debts:", error);
        return res.status(500).json({
            success: false,
            error: "Failed to fetch debts",
        });
    }
};
/**
 * Get total debt amount for current user
 * GET /api/rewards/debts/total
 */
export const getTotalDebt = async (req, res) => {
    try {
        if (!req.user?.id) {
            return res.status(401).json({ error: "Unauthorized" });
        }
        const totalDebt = await DebtManagementService.getTotalDebtAmount(req.user.id);
        return res.status(200).json({
            success: true,
            data: {
                totalDebt,
                hasDebt: totalDebt > 0,
            },
        });
    }
    catch (error) {
        console.error("Error fetching total debt:", error);
        return res.status(500).json({
            success: false,
            error: "Failed to fetch total debt",
        });
    }
};
/**
 * Get details of a specific debt
 * GET /api/rewards/debts/:debtId
 */
export const getDebtDetails = async (req, res) => {
    try {
        if (!req.user?.id) {
            return res.status(401).json({ error: "Unauthorized" });
        }
        const { debtId } = req.params;
        const debt = await DebtManagementService.getDebtById(debtId);
        if (!debt) {
            return res.status(404).json({
                success: false,
                error: "Debt not found",
            });
        }
        // Verify ownership
        if (debt.userId !== req.user.id) {
            return res.status(403).json({
                success: false,
                error: "Unauthorized access to debt",
            });
        }
        return res.status(200).json({
            success: true,
            data: debt,
        });
    }
    catch (error) {
        console.error("Error fetching debt details:", error);
        return res.status(500).json({
            success: false,
            error: "Failed to fetch debt details",
        });
    }
};
/**
 * Make a payment towards a debt
 * POST /api/rewards/pay-debt
 */
export const payDebt = async (req, res) => {
    try {
        if (!req.user?.id) {
            return res.status(401).json({ error: "Unauthorized" });
        }
        // Validate request body
        const validation = payDebtSchema.safeParse(req.body);
        if (!validation.success) {
            return res.status(400).json({
                success: false,
                error: "Invalid payment data",
                details: validation.error.issues,
            });
        }
        const { debtId, amount } = validation.data;
        // Verify debt ownership
        const debt = await DebtManagementService.getDebtById(debtId);
        if (!debt) {
            return res.status(404).json({
                success: false,
                error: "Debt not found",
            });
        }
        if (debt.userId !== req.user.id) {
            return res.status(403).json({
                success: false,
                error: "Unauthorized access to debt",
            });
        }
        // Check if debt is already paid
        if (debt.status === "PAID") {
            return res.status(400).json({
                success: false,
                error: "This debt has already been paid",
            });
        }
        // Verify payment amount doesn't exceed remaining balance
        const remainingBalance = debt.currentAmount - debt.paidAmount;
        if (amount > remainingBalance) {
            return res.status(400).json({
                success: false,
                error: `Payment amount (${amount}) exceeds remaining balance (${remainingBalance})`,
            });
        }
        // Import SSLCommerz service
        const { SSLCommerzService } = await import("../services/sslcommerz.service");
        const sslCommerz = new SSLCommerzService();
        // Generate unique transaction ID
        const transactionId = `DEBT_${debtId}_${Date.now()}`;
        // Prepare payment data for SSLCommerz
        const paymentData = {
            total_amount: amount,
            currency: process.env.CURRENCY || "BDT",
            tran_id: transactionId,
            success_url: `${process.env.PAYMENT_SUCCESS_URL}?type=debt&debtId=${debtId}`,
            fail_url: `${process.env.PAYMENT_FAIL_URL}?type=debt&debtId=${debtId}`,
            cancel_url: `${process.env.PAYMENT_CANCEL_URL}?type=debt&debtId=${debtId}`,
            ipn_url: process.env.PAYMENT_IPN_URL,
            cus_name: `${req.user.firstName} ${req.user.lastName}`,
            cus_email: req.user.email,
            cus_add1: "Dhaka",
            cus_city: "Dhaka",
            cus_postcode: "1000",
            cus_country: "Bangladesh",
            cus_phone: req.user.phone,
            shipping_method: "NO",
            product_name: `Debt Payment - ${debtId}`,
            product_category: "Debt",
            product_profile: "non-physical-goods",
        };
        console.log("💳 Initiating SSLCommerz payment for debt:", {
            debtId,
            amount,
            transactionId,
        });
        // Initialize payment with SSLCommerz
        const paymentResponse = await sslCommerz.initPayment(paymentData);
        if (!paymentResponse.success) {
            return res.status(400).json({
                success: false,
                error: paymentResponse.message || "Failed to initialize payment",
            });
        }
        console.log("✅ SSLCommerz payment initialized:", paymentResponse.gatewayPageURL);
        return res.status(200).json({
            success: true,
            message: "Payment initialized successfully",
            data: {
                paymentUrl: paymentResponse.gatewayPageURL,
                transactionId: transactionId,
                amount: amount,
                debtId: debtId,
            },
        });
    }
    catch (error) {
        console.error("Error processing debt payment:", error);
        return res.status(500).json({
            success: false,
            error: "Failed to process payment",
        });
    }
};
/**
 * Admin: Waive a user's debt
 * POST /api/rewards/debts/:debtId/waive
 */
export const waiveDebt = async (req, res) => {
    try {
        if (!req.user?.id || req.user?.role !== "ADMIN") {
            return res.status(403).json({
                success: false,
                error: "Admin access required",
            });
        }
        const { debtId } = req.params;
        const { notes } = req.body;
        const debt = await DebtManagementService.getDebtById(debtId);
        if (!debt) {
            return res.status(404).json({
                success: false,
                error: "Debt not found",
            });
        }
        const waivedDebt = await DebtManagementService.waiveDebt(debtId, req.user.id, notes);
        return res.status(200).json({
            success: true,
            message: "Debt waived successfully",
            data: waivedDebt,
        });
    }
    catch (error) {
        console.error("Error waiving debt:", error);
        return res.status(500).json({
            success: false,
            error: "Failed to waive debt",
        });
    }
};
/**
 * Admin: Get all debts in the system
 * GET /api/rewards/debts/all
 */
export const getAllDebts = async (req, res) => {
    try {
        if (!req.user?.id || req.user?.role !== "ADMIN") {
            return res.status(403).json({
                success: false,
                error: "Admin access required",
            });
        }
        const { status } = req.query;
        // TODO: Implement pagination and filtering
        // For now, this is a placeholder
        return res.status(200).json({
            success: true,
            message: "Admin debt listing - to be implemented with pagination",
            data: [],
        });
    }
    catch (error) {
        console.error("Error fetching all debts:", error);
        return res.status(500).json({
            success: false,
            error: "Failed to fetch debts",
        });
    }
};
