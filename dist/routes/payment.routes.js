import { Router } from "express";
import { PaymentController } from "../controllers/payment.controller";
import { authenticateToken } from "../middlewares/auth.middleware";
import { roleMiddleware } from "../middlewares/role.middleware";
import { UserRole } from "@prisma/client";
const router = Router();
// All routes require authentication
router.use(authenticateToken);
/**
 * @route GET /api/payments
 * @desc Get all payments with pagination and filtering
 * @access Private (Police/Admin)
 */
router.get("/", roleMiddleware([UserRole.ADMIN, UserRole.POLICE]), PaymentController.getAllPayments);
/**
 * @route GET /api/payments/stats
 * @desc Get payment statistics
 * @access Private (Police/Admin)
 */
router.get("/stats", roleMiddleware([UserRole.ADMIN, UserRole.POLICE]), PaymentController.getPaymentStats);
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
 * @route PUT /api/payments/status
 * @desc Update payment status
 * @access Private (Police/Admin)
 */
router.put("/status", roleMiddleware([UserRole.ADMIN, UserRole.POLICE]), PaymentController.updatePaymentStatus);
export { router as paymentRoutes };
