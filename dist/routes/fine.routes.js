"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fineRoutes = void 0;
const express_1 = require("express");
const fine_controller_1 = require("../controllers/fine.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const role_middleware_1 = require("../middlewares/role.middleware");
const client_1 = require("@prisma/client");
const router = (0, express_1.Router)();
exports.fineRoutes = router;
// All routes require authentication
router.use(auth_middleware_1.authenticateToken);
/**
 * @route GET /api/fines
 * @desc Get all fines with pagination and filtering
 * @access Private (Super Admin/Admin/Police)
 */
router.get("/", (0, role_middleware_1.roleMiddleware)([client_1.UserRole.SUPER_ADMIN, client_1.UserRole.ADMIN, client_1.UserRole.POLICE]), fine_controller_1.FineController.getAllFines);
/**
 * @route GET /api/fines/stats
 * @desc Get fine statistics
 * @access Private (Super Admin/Admin/Police)
 */
router.get("/stats", (0, role_middleware_1.roleMiddleware)([client_1.UserRole.SUPER_ADMIN, client_1.UserRole.ADMIN, client_1.UserRole.POLICE]), fine_controller_1.FineController.getFineStats);
/**
 * @route GET /api/fines/overdue
 * @desc Get overdue fines
 * @access Private (Super Admin/Admin/Police)
 */
router.get("/overdue", (0, role_middleware_1.roleMiddleware)([client_1.UserRole.SUPER_ADMIN, client_1.UserRole.ADMIN, client_1.UserRole.POLICE]), fine_controller_1.FineController.getOverdueFines);
/**
 * @route GET /api/fines/my-fines
 * @desc Get user's fines
 * @access Private (All authenticated users)
 */
router.get("/my-fines", (0, role_middleware_1.roleMiddleware)([
    client_1.UserRole.SUPER_ADMIN,
    client_1.UserRole.ADMIN,
    client_1.UserRole.POLICE,
    client_1.UserRole.FIRE_SERVICE,
    client_1.UserRole.CITIZEN,
]), fine_controller_1.FineController.getUserFines);
/**
 * @route GET /api/fines/:fineId
 * @desc Get fine by ID
 * @access Private (Super Admin/Admin/Police)
 */
router.get("/:fineId", (0, role_middleware_1.roleMiddleware)([client_1.UserRole.SUPER_ADMIN, client_1.UserRole.ADMIN, client_1.UserRole.POLICE]), fine_controller_1.FineController.getFineById);
/**
 * @route POST /api/fines
 * @desc Create new fine
 * @access Private (Super Admin/Admin/Police)
 */
router.post("/", (0, role_middleware_1.roleMiddleware)([client_1.UserRole.SUPER_ADMIN, client_1.UserRole.ADMIN, client_1.UserRole.POLICE]), fine_controller_1.FineController.createFine);
/**
 * @route PUT /api/fines/:fineId
 * @desc Update fine
 * @access Private (Super Admin/Admin/Police)
 */
router.put("/:fineId", (0, role_middleware_1.roleMiddleware)([client_1.UserRole.SUPER_ADMIN, client_1.UserRole.ADMIN, client_1.UserRole.POLICE]), fine_controller_1.FineController.updateFine);
/**
 * @route DELETE /api/fines/:fineId
 * @desc Delete fine
 * @access Private (Super Admin/Admin only)
 */
router.delete("/:fineId", (0, role_middleware_1.roleMiddleware)([client_1.UserRole.SUPER_ADMIN, client_1.UserRole.ADMIN]), fine_controller_1.FineController.deleteFine);
