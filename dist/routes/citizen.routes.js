"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.citizenRoutes = void 0;
const express_1 = require("express");
const citizen_controller_1 = require("../controllers/citizen.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = (0, express_1.Router)();
exports.citizenRoutes = router;
// All routes require authentication
router.use(auth_middleware_1.authenticateToken);
/**
 * @route GET /api/citizen/stats
 * @desc Get citizen dashboard statistics
 * @access Private (Citizen)
 */
router.get("/stats", citizen_controller_1.getCitizenStats);
/**
 * @route GET /api/citizen/analytics
 * @desc Get citizen dashboard analytics with graph data
 * @access Private (Citizen)
 */
router.get("/analytics", citizen_controller_1.getCitizenAnalytics);
