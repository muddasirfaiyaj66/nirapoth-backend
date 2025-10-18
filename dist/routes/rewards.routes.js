"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const rewards_controller_1 = require("../controllers/rewards.controller");
const DebtController = __importStar(require("../controllers/debt.controller"));
const auth_middleware_1 = require("../middlewares/auth.middleware");
const role_middleware_1 = require("../middlewares/role.middleware");
const client_1 = require("@prisma/client");
const router = (0, express_1.Router)();
// All routes require authentication
router.use(auth_middleware_1.authenticateToken);
/**
 * @route GET /api/rewards/balance
 * @desc Get user's reward balance
 * @access Private (Citizen)
 */
router.get("/balance", rewards_controller_1.RewardsController.getMyBalance);
/**
 * @route GET /api/rewards/transactions
 * @desc Get user's reward transactions
 * @access Private (Citizen)
 */
router.get("/transactions", rewards_controller_1.RewardsController.getMyTransactions);
/**
 * @route GET /api/rewards/stats
 * @desc Get user's reward statistics
 * @access Private (Citizen)
 */
router.get("/stats", rewards_controller_1.RewardsController.getMyStats);
/**
 * @route POST /api/rewards/withdraw
 * @desc Request a withdrawal
 * @access Private (Citizen)
 */
router.post("/withdraw", rewards_controller_1.RewardsController.requestWithdrawal);
/**
 * @route GET /api/rewards/withdrawals
 * @desc Get user's withdrawal requests
 * @access Private (Citizen)
 */
router.get("/withdrawals", rewards_controller_1.RewardsController.getMyWithdrawals);
/**
 * @route DELETE /api/rewards/withdrawals/:withdrawalId
 * @desc Cancel a withdrawal request
 * @access Private (Citizen)
 */
router.delete("/withdrawals/:withdrawalId", rewards_controller_1.RewardsController.cancelWithdrawal);
/**
 * Debt Management Routes
 */
/**
 * @route GET /api/rewards/debts
 * @desc Get user's debt summary with all outstanding debts
 * @access Private (Citizen)
 */
router.get("/debts", DebtController.getMyDebts);
/**
 * @route GET /api/rewards/debts/total
 * @desc Get total debt amount for current user
 * @access Private (Citizen)
 */
router.get("/debts/total", DebtController.getTotalDebt);
/**
 * @route GET /api/rewards/debts/:debtId
 * @desc Get details of a specific debt
 * @access Private (Citizen)
 */
router.get("/debts/:debtId", DebtController.getDebtDetails);
/**
 * @route POST /api/rewards/pay-debt
 * @desc Make a payment towards a debt
 * @access Private (Citizen)
 */
router.post("/pay-debt", DebtController.payDebt);
/**
 * @route POST /api/rewards/debts/:debtId/waive
 * @desc Waive a user's debt (Admin only)
 * @access Private (Admin)
 */
router.post("/debts/:debtId/waive", (0, role_middleware_1.roleMiddleware)([client_1.UserRole.ADMIN]), DebtController.waiveDebt);
/**
 * @route GET /api/rewards/debts/all
 * @desc Get all debts in the system (Admin only)
 * @access Private (Admin)
 */
router.get("/debts/all", (0, role_middleware_1.roleMiddleware)([client_1.UserRole.ADMIN]), DebtController.getAllDebts);
exports.default = router;
