import express from "express";
import {
  getPoliceStats,
  getPoliceAnalytics,
} from "../controllers/police.controller";
import {
  searchDriverByLicense,
  applyGemPenalty,
  getGemPenaltyHistory,
  getAllGemPenalties,
  getGemPenaltyStats,
  getRecommendedDeduction,
} from "../controllers/gemPenalty.controller";
import { authenticateToken } from "../middlewares/auth.middleware";

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

/**
 * @route GET /api/police/stats
 * @desc Get police dashboard statistics
 * @access Private (Police)
 */
router.get("/stats", getPoliceStats);

/**
 * @route GET /api/police/analytics
 * @desc Get police dashboard analytics with graph data
 * @access Private (Police)
 */
router.get("/analytics", getPoliceAnalytics);

// =======================
// Gem Penalty Routes
// =======================

/**
 * @route GET /api/police/search-driver
 * @desc Search driver by license number
 * @access Private (Police/Admin)
 */
router.get("/search-driver", searchDriverByLicense);

/**
 * @route POST /api/police/apply-gem-penalty
 * @desc Apply gem penalty to a driver
 * @access Private (Police/Admin)
 */
router.post("/apply-gem-penalty", applyGemPenalty);

/**
 * @route GET /api/police/gem-penalty-history/:citizenId
 * @desc Get gem penalty history for a citizen
 * @access Private (Police/Admin)
 */
router.get("/gem-penalty-history/:citizenId", getGemPenaltyHistory);

/**
 * @route GET /api/police/gem-penalties
 * @desc Get all gem penalties with filters
 * @access Private (Police/Admin)
 */
router.get("/gem-penalties", getAllGemPenalties);

/**
 * @route GET /api/police/gem-penalty-stats
 * @desc Get gem penalty statistics
 * @access Private (Police/Admin)
 */
router.get("/gem-penalty-stats", getGemPenaltyStats);

/**
 * @route GET /api/police/recommended-deduction/:severity
 * @desc Get recommended gem deduction for a severity level
 * @access Private (Police/Admin)
 */
router.get("/recommended-deduction/:severity", getRecommendedDeduction);

export { router as policeRoutes };
