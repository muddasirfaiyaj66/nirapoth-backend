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
 * @access Private (Super Admin/Admin/Police)
 */
router.get("/", roleMiddleware([UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.POLICE]), ViolationController.getAllViolations);
/**
 * @route GET /api/violations/stats
 * @desc Get violation statistics
 * @access Private (Super Admin/Admin/Police)
 */
router.get("/stats", roleMiddleware([UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.POLICE]), ViolationController.getViolationStats);
/**
 * @route GET /api/violations/rules
 * @desc Get all rules
 * @access Private (All authenticated users)
 */
router.get("/rules", roleMiddleware([
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.POLICE,
    UserRole.FIRE_SERVICE,
    UserRole.CITIZEN,
]), ViolationController.getAllRules);
/**
 * @route GET /api/violations/:violationId
 * @desc Get violation by ID
 * @access Private (Super Admin/Admin/Police)
 */
router.get("/:violationId", roleMiddleware([UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.POLICE]), ViolationController.getViolationById);
/**
 * @route POST /api/violations/rules
 * @desc Create new rule
 * @access Private (Super Admin/Admin/Police)
 */
router.post("/rules", roleMiddleware([UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.POLICE]), ViolationController.createRule);
/**
 * @route PUT /api/violations/rules/:ruleId
 * @desc Update rule (including toggle active status)
 * @access Private (Super Admin/Admin/Police)
 */
router.put("/rules/:ruleId", roleMiddleware([UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.POLICE]), ViolationController.updateRule);
/**
 * @route DELETE /api/violations/rules/:ruleId
 * @desc Delete rule
 * @access Private (Super Admin/Admin only)
 */
router.delete("/rules/:ruleId", roleMiddleware([UserRole.SUPER_ADMIN, UserRole.ADMIN]), ViolationController.deleteRule);
/**
 * @route POST /api/violations
 * @desc Create new violation
 * @access Private (Super Admin/Admin/Police)
 */
router.post("/", roleMiddleware([UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.POLICE]), ViolationController.createViolation);
/**
 * @route PUT /api/violations/:violationId/status
 * @desc Update violation status
 * @access Private (Super Admin/Admin/Police)
 */
router.put("/:violationId/status", roleMiddleware([UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.POLICE]), ViolationController.updateViolationStatus);
/**
 * @route POST /api/violations/:violationId/fine
 * @desc Create fine for violation
 * @access Private (Super Admin/Admin/Police)
 */
router.post("/:violationId/fine", roleMiddleware([UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.POLICE]), ViolationController.createFine);
export { router as violationRoutes };
