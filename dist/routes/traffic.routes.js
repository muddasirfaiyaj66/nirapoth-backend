import { Router } from "express";
import { TrafficController } from "../controllers/traffic.controller";
const router = Router();
/**
 * PUBLIC ENDPOINTS - No authentication required
 * These endpoints are open for public safety
 */
// GET /api/traffic/nearby - Get traffic jams within radius
router.get("/nearby", TrafficController.getNearbyTraffic);
// GET /api/traffic/accidents - Get accident hotspots
router.get("/accidents", TrafficController.getAccidentHotspots);
// POST /api/traffic/route - Calculate safe route
router.post("/route", TrafficController.calculateSafeRoute);
// POST /api/traffic/report - Report traffic (optional auth)
router.post("/report", TrafficController.reportTraffic);
export default router;
