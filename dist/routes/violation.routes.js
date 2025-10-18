"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.violationRoutes = void 0;
const express_1 = __importDefault(require("express"));
const violation_controller_1 = require("../controllers/violation.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const role_middleware_1 = require("../middlewares/role.middleware");
const client_1 = require("@prisma/client");
const router = express_1.default.Router();
exports.violationRoutes = router;
// All routes require authentication
router.use(auth_middleware_1.authenticateToken);
/**
 * @route GET /api/violations
 * @desc Get all violations with pagination and filtering
 * @access Private (Super Admin/Admin/Police)
 */
router.get("/", (0, role_middleware_1.roleMiddleware)([client_1.UserRole.SUPER_ADMIN, client_1.UserRole.ADMIN, client_1.UserRole.POLICE]), violation_controller_1.ViolationController.getAllViolations);
/**
 * @route GET /api/violations/stats
 * @desc Get violation statistics
 * @access Private (Super Admin/Admin/Police)
 */
router.get("/stats", (0, role_middleware_1.roleMiddleware)([client_1.UserRole.SUPER_ADMIN, client_1.UserRole.ADMIN, client_1.UserRole.POLICE]), violation_controller_1.ViolationController.getViolationStats);
/**
 * @route GET /api/violations/rules
 * @desc Get all rules
 * @access Private (All authenticated users)
 */
router.get("/rules", (0, role_middleware_1.roleMiddleware)([
    client_1.UserRole.SUPER_ADMIN,
    client_1.UserRole.ADMIN,
    client_1.UserRole.POLICE,
    client_1.UserRole.FIRE_SERVICE,
    client_1.UserRole.CITIZEN,
]), violation_controller_1.ViolationController.getAllRules);
/**
 * @route GET /api/violations/:violationId
 * @desc Get violation by ID
 * @access Private (Super Admin/Admin/Police)
 */
router.get("/:violationId", (0, role_middleware_1.roleMiddleware)([client_1.UserRole.SUPER_ADMIN, client_1.UserRole.ADMIN, client_1.UserRole.POLICE]), violation_controller_1.ViolationController.getViolationById);
/**
 * @route POST /api/violations/rules
 * @desc Create new rule
 * @access Private (Super Admin/Admin/Police)
 */
router.post("/rules", (0, role_middleware_1.roleMiddleware)([client_1.UserRole.SUPER_ADMIN, client_1.UserRole.ADMIN, client_1.UserRole.POLICE]), violation_controller_1.ViolationController.createRule);
/**
 * @route PUT /api/violations/rules/:ruleId
 * @desc Update rule (including toggle active status)
 * @access Private (Super Admin/Admin/Police)
 */
router.put("/rules/:ruleId", (0, role_middleware_1.roleMiddleware)([client_1.UserRole.SUPER_ADMIN, client_1.UserRole.ADMIN, client_1.UserRole.POLICE]), violation_controller_1.ViolationController.updateRule);
/**
 * @route DELETE /api/violations/rules/:ruleId
 * @desc Delete rule
 * @access Private (Super Admin/Admin only)
 */
router.delete("/rules/:ruleId", (0, role_middleware_1.roleMiddleware)([client_1.UserRole.SUPER_ADMIN, client_1.UserRole.ADMIN]), violation_controller_1.ViolationController.deleteRule);
/**
 * @route POST /api/violations
 * @desc Create new violation
 * @access Private (Super Admin/Admin/Police)
 */
router.post("/", (0, role_middleware_1.roleMiddleware)([client_1.UserRole.SUPER_ADMIN, client_1.UserRole.ADMIN, client_1.UserRole.POLICE]), violation_controller_1.ViolationController.createViolation);
/**
 * @route PUT /api/violations/:violationId/status
 * @desc Update violation status
 * @access Private (Super Admin/Admin/Police)
 */
router.put("/:violationId/status", (0, role_middleware_1.roleMiddleware)([client_1.UserRole.SUPER_ADMIN, client_1.UserRole.ADMIN, client_1.UserRole.POLICE]), violation_controller_1.ViolationController.updateViolationStatus);
/**
 * @route POST /api/violations/:violationId/fine
 * @desc Create fine for violation
 * @access Private (Super Admin/Admin/Police)
 */
router.post("/:violationId/fine", (0, role_middleware_1.roleMiddleware)([client_1.UserRole.SUPER_ADMIN, client_1.UserRole.ADMIN, client_1.UserRole.POLICE]), violation_controller_1.ViolationController.createFine);
