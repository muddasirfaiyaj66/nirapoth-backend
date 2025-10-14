import { Router } from "express";
import { AIIntegrationController } from "../controllers/aiIntegration.controller";
import { authenticateToken } from "../middlewares/auth.middleware";
import { roleMiddleware } from "../middlewares/role.middleware";
import { UserRole } from "@prisma/client";

const router = Router();

// Apply authentication to all routes
router.use(authenticateToken);

// Health check endpoint (available to all authenticated users)
router.get("/health", AIIntegrationController.checkHealth);

// AI service statistics (available to all authenticated users)
router.get("/stats", AIIntegrationController.getAIStats);

// Get accident data from AI service (available to police, fire service, and admin)
router.get(
  "/accidents",
  roleMiddleware([UserRole.POLICE, UserRole.FIRE_SERVICE, UserRole.ADMIN]),
  AIIntegrationController.getAccidentData
);

// Get specific accident by ID (available to police, fire service, and admin)
router.get(
  "/accidents/:accidentId",
  roleMiddleware([UserRole.POLICE, UserRole.FIRE_SERVICE, UserRole.ADMIN]),
  AIIntegrationController.getAccidentById
);

// Send accident alert to AI service (available to police, fire service, and admin)
router.post(
  "/alerts",
  roleMiddleware([UserRole.POLICE, UserRole.FIRE_SERVICE, UserRole.ADMIN]),
  AIIntegrationController.sendAccidentAlert
);

// Process image/video link for detection (available to police, fire service, and admin)
router.post(
  "/detect",
  roleMiddleware([UserRole.POLICE, UserRole.FIRE_SERVICE, UserRole.ADMIN]),
  AIIntegrationController.processMediaForDetection
);

// Report accident with media link (available to all authenticated users)
router.post("/accidents", AIIntegrationController.reportAccident);

// Sync accident data with database (admin only)
router.post(
  "/sync",
  roleMiddleware([UserRole.ADMIN]),
  AIIntegrationController.syncAccidentData
);

export { router as aiIntegrationRoutes };
