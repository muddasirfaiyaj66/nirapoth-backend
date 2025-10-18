"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const security_middleware_1 = require("../middlewares/security.middleware");
const admin_controller_1 = require("../controllers/admin.controller");
const router = (0, express_1.Router)();
// All admin routes require authentication and admin role
router.use(auth_middleware_1.authenticateToken);
router.use(security_middleware_1.adminOnly);
// Dashboard overview
router.get("/overview", admin_controller_1.AdminController.getAdminOverview);
// User management routes
router.get("/users", admin_controller_1.AdminController.getAllUsers);
router.get("/users/stats", admin_controller_1.AdminController.getUserStats);
router.get("/users/verification", admin_controller_1.AdminController.getPendingVerifications);
router.get("/users/roles", admin_controller_1.AdminController.getRoleManagement);
router.get("/users/blocked", admin_controller_1.AdminController.getBlockedUsers);
router.post("/users/create", admin_controller_1.AdminController.createUser);
router.post("/users/update-role", admin_controller_1.AdminController.updateUserRole);
router.post("/users/verify", admin_controller_1.AdminController.verifyUser);
router.post("/users/block", admin_controller_1.AdminController.blockUser);
router.post("/users/unblock", admin_controller_1.AdminController.unblockUser);
router.post("/users/delete", admin_controller_1.AdminController.softDeleteUser);
// Violation management routes
router.get("/violations", admin_controller_1.AdminController.getAllViolations);
router.post("/violations/update-status", admin_controller_1.AdminController.updateViolationStatus);
// Analytics routes
router.get("/analytics/test", admin_controller_1.AdminController.testAnalytics);
router.get("/analytics/system", admin_controller_1.AdminController.getSystemAnalytics);
router.get("/analytics/revenue", admin_controller_1.AdminController.getRevenueAnalytics);
router.get("/analytics/traffic", admin_controller_1.AdminController.getTrafficAnalytics);
// Citizen gem management routes
router.post("/citizens/gems/manage", admin_controller_1.AdminController.manageCitizenGems);
router.post("/citizens/restriction", admin_controller_1.AdminController.setCitizenRestriction);
router.get("/citizens/:citizenId/gems", admin_controller_1.AdminController.getCitizenGems);
// System maintenance routes
router.post("/system/enforce-constraints", admin_controller_1.AdminController.enforceConstraints);
// System configuration routes (Super Admin only)
router.get("/system/config", admin_controller_1.AdminController.getSystemConfig);
router.put("/system/config", admin_controller_1.AdminController.updateSystemConfig);
exports.default = router;
