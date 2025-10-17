import { Router } from "express";
import {
  getPoliceStats,
  getPoliceAnalytics,
} from "../controllers/police.controller";
import { authenticateToken } from "../middlewares/auth.middleware";

const router = Router();

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

export { router as policeRoutes };
