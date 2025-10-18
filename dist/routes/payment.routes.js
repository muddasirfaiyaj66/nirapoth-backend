"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.paymentRoutes = void 0;
const express_1 = __importDefault(require("express"));
const payment_controller_1 = require("../controllers/payment.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const role_middleware_1 = require("../middlewares/role.middleware");
const client_1 = require("@prisma/client");
const router = express_1.default.Router();
exports.paymentRoutes = router;
// SSLCommerz callback routes (public - no authentication required)
router.post("/sslcommerz/success", payment_controller_1.PaymentController.handleSSLSuccess);
router.get("/sslcommerz/success", payment_controller_1.PaymentController.handleSSLSuccess);
router.post("/sslcommerz/fail", payment_controller_1.PaymentController.handleSSLFail);
router.get("/sslcommerz/fail", payment_controller_1.PaymentController.handleSSLFail);
router.post("/sslcommerz/cancel", payment_controller_1.PaymentController.handleSSLCancel);
router.get("/sslcommerz/cancel", payment_controller_1.PaymentController.handleSSLCancel);
router.post("/sslcommerz/ipn", payment_controller_1.PaymentController.handleSSLIPN);
// Debt payment processing (public - called from frontend callback)
router.post("/process-debt-payment", payment_controller_1.PaymentController.processDebtPayment);
// All other routes require authentication
router.use(auth_middleware_1.authenticateToken);
/**
 * @route GET /api/payments
 * @desc Get all payments with pagination and filtering
 * @access Private (Police/Admin)
 */
router.get("/", (0, role_middleware_1.roleMiddleware)([client_1.UserRole.ADMIN, client_1.UserRole.POLICE]), payment_controller_1.PaymentController.getAllPayments);
/**
 * @route GET /api/payments/stats
 * @desc Get payment statistics
 * @access Private (Police/Admin)
 */
router.get("/stats", (0, role_middleware_1.roleMiddleware)([client_1.UserRole.ADMIN, client_1.UserRole.POLICE]), payment_controller_1.PaymentController.getPaymentStats);
/**
 * @route GET /api/payments/my-payments
 * @desc Get user's payments
 * @access Private
 */
router.get("/my-payments", payment_controller_1.PaymentController.getUserPayments);
/**
 * @route GET /api/payments/unpaid-fines
 * @desc Get user's unpaid fines
 * @access Private
 */
router.get("/unpaid-fines", payment_controller_1.PaymentController.getUserUnpaidFines);
/**
 * @route GET /api/payments/:paymentId
 * @desc Get payment by ID
 * @access Private
 */
router.get("/:paymentId", payment_controller_1.PaymentController.getPaymentById);
/**
 * @route POST /api/payments
 * @desc Create new payment
 * @access Private
 */
router.post("/", payment_controller_1.PaymentController.createPayment);
/**
 * @route POST /api/payments/init-online
 * @desc Initialize online payment with SSLCommerz
 * @access Private
 */
router.post("/init-online", payment_controller_1.PaymentController.initOnlinePayment);
/**
 * @route GET /api/payments/transaction/:transactionId
 * @desc Query transaction status
 * @access Private
 */
router.get("/transaction/:transactionId", payment_controller_1.PaymentController.queryTransaction);
router.get("/verify/:transactionId", payment_controller_1.PaymentController.verifyTransaction);
/**
 * @route POST /api/payments/:paymentId/refund
 * @desc Initiate refund for a payment
 * @access Private (Admin/Police)
 */
router.post("/:paymentId/refund", (0, role_middleware_1.roleMiddleware)([client_1.UserRole.ADMIN, client_1.UserRole.POLICE]), payment_controller_1.PaymentController.initiateRefund);
/**
 * @route PUT /api/payments/status
 * @desc Update payment status
 * @access Private (Police/Admin)
 */
router.put("/status", (0, role_middleware_1.roleMiddleware)([client_1.UserRole.ADMIN, client_1.UserRole.POLICE]), payment_controller_1.PaymentController.updatePaymentStatus);
