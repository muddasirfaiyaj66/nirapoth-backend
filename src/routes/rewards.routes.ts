import { Router } from "express";
import { RewardsController } from "../controllers/rewards.controller";
import * as DebtController from "../controllers/debt.controller";
import { authenticateToken } from "../middlewares/auth.middleware";
import { roleMiddleware } from "../middlewares/role.middleware";
import { UserRole } from "@prisma/client";

const router = Router();

// All routes require authentication
router.use(authenticateToken);

/**
 * @route GET /api/rewards/balance
 * @desc Get user's reward balance
 * @access Private (Citizen)
 */
router.get("/balance", RewardsController.getMyBalance);

/**
 * @route GET /api/rewards/transactions
 * @desc Get user's reward transactions
 * @access Private (Citizen)
 */
router.get("/transactions", RewardsController.getMyTransactions);

/**
 * @route GET /api/rewards/stats
 * @desc Get user's reward statistics
 * @access Private (Citizen)
 */
router.get("/stats", RewardsController.getMyStats);

/**
 * @route POST /api/rewards/withdraw
 * @desc Request a withdrawal
 * @access Private (Citizen)
 */
router.post("/withdraw", RewardsController.requestWithdrawal);

/**
 * @route GET /api/rewards/withdrawals
 * @desc Get user's withdrawal requests
 * @access Private (Citizen)
 */
router.get("/withdrawals", RewardsController.getMyWithdrawals);

/**
 * @route DELETE /api/rewards/withdrawals/:withdrawalId
 * @desc Cancel a withdrawal request
 * @access Private (Citizen)
 */
router.delete("/withdrawals/:withdrawalId", RewardsController.cancelWithdrawal);

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
router.post(
  "/debts/:debtId/waive",
  roleMiddleware([UserRole.ADMIN]),
  DebtController.waiveDebt
);

/**
 * @route GET /api/rewards/debts/all
 * @desc Get all debts in the system (Admin only)
 * @access Private (Admin)
 */
router.get(
  "/debts/all",
  roleMiddleware([UserRole.ADMIN]),
  DebtController.getAllDebts
);

export default router;
