import express from "express";
import {
  getCitizenStats,
  getCitizenAnalytics,
} from "../controllers/citizen.controller";
import { authenticateToken } from "../middlewares/auth.middleware";

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

/**
 * @route GET /api/citizen/stats
 * @desc Get citizen dashboard statistics
 * @access Private (Citizen)
 */
router.get("/stats", getCitizenStats);

/**
 * @route GET /api/citizen/analytics
 * @desc Get citizen dashboard analytics with graph data
 * @access Private (Citizen)
 */
router.get("/analytics", getCitizenAnalytics);

export { router as citizenRoutes };
