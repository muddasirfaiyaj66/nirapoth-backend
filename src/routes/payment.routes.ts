import express from "express";
import { PaymentController } from "../controllers/payment.controller";
import { authenticateToken } from "../middlewares/auth.middleware";
import { roleMiddleware } from "../middlewares/role.middleware";
import { UserRole } from "@prisma/client";

const router = express.Router();

// SSLCommerz callback routes (public - no authentication required)
router.post("/sslcommerz/success", PaymentController.handleSSLSuccess);
router.get("/sslcommerz/success", PaymentController.handleSSLSuccess);
router.post("/sslcommerz/fail", PaymentController.handleSSLFail);
router.get("/sslcommerz/fail", PaymentController.handleSSLFail);
router.post("/sslcommerz/cancel", PaymentController.handleSSLCancel);
router.get("/sslcommerz/cancel", PaymentController.handleSSLCancel);
router.post("/sslcommerz/ipn", PaymentController.handleSSLIPN);

// Debt payment processing (public - called from frontend callback)
router.post("/process-debt-payment", PaymentController.processDebtPayment);

// All other routes require authentication
router.use(authenticateToken);

/**
 * @route GET /api/payments
 * @desc Get all payments with pagination and filtering
 * @access Private (Police/Admin)
 */
router.get(
  "/",
  roleMiddleware([UserRole.ADMIN, UserRole.POLICE]),
  PaymentController.getAllPayments
);

/**
 * @route GET /api/payments/stats
 * @desc Get payment statistics
 * @access Private (Police/Admin)
 */
router.get(
  "/stats",
  roleMiddleware([UserRole.ADMIN, UserRole.POLICE]),
  PaymentController.getPaymentStats
);

/**
 * @route GET /api/payments/my-payments
 * @desc Get user's payments
 * @access Private
 */
router.get("/my-payments", PaymentController.getUserPayments);

/**
 * @route GET /api/payments/unpaid-fines
 * @desc Get user's unpaid fines
 * @access Private
 */
router.get("/unpaid-fines", PaymentController.getUserUnpaidFines);

/**
 * @route GET /api/payments/:paymentId
 * @desc Get payment by ID
 * @access Private
 */
router.get("/:paymentId", PaymentController.getPaymentById);

/**
 * @route POST /api/payments
 * @desc Create new payment
 * @access Private
 */
router.post("/", PaymentController.createPayment);

/**
 * @route POST /api/payments/init-online
 * @desc Initialize online payment with SSLCommerz
 * @access Private
 */
router.post("/init-online", PaymentController.initOnlinePayment);

/**
 * @route GET /api/payments/transaction/:transactionId
 * @desc Query transaction status
 * @access Private
 */
router.get("/transaction/:transactionId", PaymentController.queryTransaction);
router.get("/verify/:transactionId", PaymentController.verifyTransaction);

/**
 * @route POST /api/payments/:paymentId/refund
 * @desc Initiate refund for a payment
 * @access Private (Admin/Police)
 */
router.post(
  "/:paymentId/refund",
  roleMiddleware([UserRole.ADMIN, UserRole.POLICE]),
  PaymentController.initiateRefund
);

/**
 * @route PUT /api/payments/status
 * @desc Update payment status
 * @access Private (Police/Admin)
 */
router.put(
  "/status",
  roleMiddleware([UserRole.ADMIN, UserRole.POLICE]),
  PaymentController.updatePaymentStatus
);

export { router as paymentRoutes };
