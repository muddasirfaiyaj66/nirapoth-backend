"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.policeRoutes = void 0;
const express_1 = require("express");
const police_controller_1 = require("../controllers/police.controller");
const gemPenalty_controller_1 = require("../controllers/gemPenalty.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = (0, express_1.Router)();
exports.policeRoutes = router;
// All routes require authentication
router.use(auth_middleware_1.authenticateToken);
/**
 * @route GET /api/police/stats
 * @desc Get police dashboard statistics
 * @access Private (Police)
 */
router.get("/stats", police_controller_1.getPoliceStats);
/**
 * @route GET /api/police/analytics
 * @desc Get police dashboard analytics with graph data
 * @access Private (Police)
 */
router.get("/analytics", police_controller_1.getPoliceAnalytics);
// =======================
// Gem Penalty Routes
// =======================
/**
 * @route GET /api/police/search-driver
 * @desc Search driver by license number
 * @access Private (Police/Admin)
 */
router.get("/search-driver", gemPenalty_controller_1.searchDriverByLicense);
/**
 * @route POST /api/police/apply-gem-penalty
 * @desc Apply gem penalty to a driver
 * @access Private (Police/Admin)
 */
router.post("/apply-gem-penalty", gemPenalty_controller_1.applyGemPenalty);
/**
 * @route GET /api/police/gem-penalty-history/:citizenId
 * @desc Get gem penalty history for a citizen
 * @access Private (Police/Admin)
 */
router.get("/gem-penalty-history/:citizenId", gemPenalty_controller_1.getGemPenaltyHistory);
/**
 * @route GET /api/police/gem-penalties
 * @desc Get all gem penalties with filters
 * @access Private (Police/Admin)
 */
router.get("/gem-penalties", gemPenalty_controller_1.getAllGemPenalties);
/**
 * @route GET /api/police/gem-penalty-stats
 * @desc Get gem penalty statistics
 * @access Private (Police/Admin)
 */
router.get("/gem-penalty-stats", gemPenalty_controller_1.getGemPenaltyStats);
/**
 * @route GET /api/police/recommended-deduction/:severity
 * @desc Get recommended gem deduction for a severity level
 * @access Private (Police/Admin)
 */
router.get("/recommended-deduction/:severity", gemPenalty_controller_1.getRecommendedDeduction);
