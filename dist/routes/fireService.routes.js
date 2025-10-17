import { Router } from "express";
import { getFireServiceStats, getFireServiceAnalytics, } from "../controllers/fireService.controller";
import { authenticateToken } from "../middlewares/auth.middleware";
const router = Router();
// All routes require authentication
router.use(authenticateToken);
/**
 * @route GET /api/fire-service/stats
 * @desc Get fire service dashboard statistics
 * @access Private (Fire Service)
 */
router.get("/stats", getFireServiceStats);
/**
 * @route GET /api/fire-service/analytics
 * @desc Get fire service dashboard analytics with graph data
 * @access Private (Fire Service)
 */
router.get("/analytics", getFireServiceAnalytics);
export { router as fireServiceRoutes };
