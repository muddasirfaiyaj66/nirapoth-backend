import { Router } from "express";
import { ViolationController } from "../controllers/violation.controller";
import { authenticateToken } from "../middlewares/auth.middleware";
import { roleMiddleware } from "../middlewares/role.middleware";
import { UserRole } from "@prisma/client";
const router = Router();
// All routes require authentication
router.use(authenticateToken);
/**
 * @route GET /api/violations
 * @desc Get all violations with pagination and filtering
 * @access Private (Police/Admin)
 */
router.get("/", roleMiddleware([UserRole.ADMIN, UserRole.POLICE]), ViolationController.getAllViolations);
/**
 * @route GET /api/violations/stats
 * @desc Get violation statistics
 * @access Private (Police/Admin)
 */
router.get("/stats", roleMiddleware([UserRole.ADMIN, UserRole.POLICE]), ViolationController.getViolationStats);
/**
 * @route GET /api/violations/:violationId
 * @desc Get violation by ID
 * @access Private (Police/Admin)
 */
router.get("/:violationId", roleMiddleware([UserRole.ADMIN, UserRole.POLICE]), ViolationController.getViolationById);
/**
 * @route POST /api/violations
 * @desc Create new violation
 * @access Private (Police/Admin)
 */
router.post("/", roleMiddleware([UserRole.ADMIN, UserRole.POLICE]), ViolationController.createViolation);
/**
 * @route PUT /api/violations/:violationId/status
 * @desc Update violation status
 * @access Private (Police/Admin)
 */
router.put("/:violationId/status", roleMiddleware([UserRole.ADMIN, UserRole.POLICE]), ViolationController.updateViolationStatus);
/**
 * @route POST /api/violations/:violationId/fine
 * @desc Create fine for violation
 * @access Private (Police/Admin)
 */
router.post("/:violationId/fine", roleMiddleware([UserRole.ADMIN, UserRole.POLICE]), ViolationController.createFine);
/**
 * @route GET /api/violations/rules
 * @desc Get all rules
 * @access Private
 */
router.get("/rules", ViolationController.getAllRules);
/**
 * @route POST /api/violations/rules
 * @desc Create new rule
 * @access Private (Admin only)
 */
router.post("/rules", roleMiddleware([UserRole.ADMIN]), ViolationController.createRule);
export { router as violationRoutes };
