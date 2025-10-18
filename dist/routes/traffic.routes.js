"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const traffic_controller_1 = require("../controllers/traffic.controller");
const router = express_1.default.Router();
/**
 * PUBLIC ENDPOINTS - No authentication required
 * These endpoints are open for public safety
 */
// GET /api/traffic/nearby - Get traffic jams within radius
router.get("/nearby", traffic_controller_1.TrafficController.getNearbyTraffic);
// GET /api/traffic/accidents - Get accident hotspots
router.get("/accidents", traffic_controller_1.TrafficController.getAccidentHotspots);
// POST /api/traffic/route - Calculate safe route
router.post("/route", traffic_controller_1.TrafficController.calculateSafeRoute);
// POST /api/traffic/report - Report traffic (optional auth)
router.post("/report", traffic_controller_1.TrafficController.reportTraffic);
exports.default = router;
