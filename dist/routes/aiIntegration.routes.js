"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.aiIntegrationRoutes = void 0;
const express_1 = __importDefault(require("express"));
const aiIntegration_controller_1 = require("../controllers/aiIntegration.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const role_middleware_1 = require("../middlewares/role.middleware");
const client_1 = require("@prisma/client");
const router = express_1.default.Router();
exports.aiIntegrationRoutes = router;
// Apply authentication to all routes
router.use(auth_middleware_1.authenticateToken);
// Health check endpoint (available to all authenticated users)
router.get("/health", aiIntegration_controller_1.AIIntegrationController.checkHealth);
// AI service statistics (available to all authenticated users)
router.get("/stats", aiIntegration_controller_1.AIIntegrationController.getAIStats);
// Get accident data from AI service (available to police, fire service, and admin)
router.get("/accidents", (0, role_middleware_1.roleMiddleware)([client_1.UserRole.POLICE, client_1.UserRole.FIRE_SERVICE, client_1.UserRole.ADMIN]), aiIntegration_controller_1.AIIntegrationController.getAccidentData);
// Get specific accident by ID (available to police, fire service, and admin)
router.get("/accidents/:accidentId", (0, role_middleware_1.roleMiddleware)([client_1.UserRole.POLICE, client_1.UserRole.FIRE_SERVICE, client_1.UserRole.ADMIN]), aiIntegration_controller_1.AIIntegrationController.getAccidentById);
// Send accident alert to AI service (available to police, fire service, and admin)
router.post("/alerts", (0, role_middleware_1.roleMiddleware)([client_1.UserRole.POLICE, client_1.UserRole.FIRE_SERVICE, client_1.UserRole.ADMIN]), aiIntegration_controller_1.AIIntegrationController.sendAccidentAlert);
// Process image/video link for detection (available to police, fire service, and admin)
router.post("/detect", (0, role_middleware_1.roleMiddleware)([client_1.UserRole.POLICE, client_1.UserRole.FIRE_SERVICE, client_1.UserRole.ADMIN]), aiIntegration_controller_1.AIIntegrationController.processMediaForDetection);
// Report accident with media link (available to all authenticated users)
router.post("/accidents", aiIntegration_controller_1.AIIntegrationController.reportAccident);
// Sync accident data with database (admin only)
router.post("/sync", (0, role_middleware_1.roleMiddleware)([client_1.UserRole.ADMIN]), aiIntegration_controller_1.AIIntegrationController.syncAccidentData);
