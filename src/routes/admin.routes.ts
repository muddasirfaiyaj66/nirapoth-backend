import { Router } from "express";
import { authenticateToken } from "../middlewares/auth.middleware";
import { adminOnly } from "../middlewares/security.middleware";
import { AdminController } from "../controllers/admin.controller";

const router = Router();

// All admin routes require authentication and admin role
router.use(authenticateToken);
router.use(adminOnly);

// Dashboard overview
router.get("/overview", AdminController.getAdminOverview);

// User management routes
router.get("/users", AdminController.getAllUsers);
router.get("/users/stats", AdminController.getUserStats);
router.get("/users/verification", AdminController.getPendingVerifications);
router.get("/users/roles", AdminController.getRoleManagement);
router.get("/users/blocked", AdminController.getBlockedUsers);
router.post("/users/create", AdminController.createUser);
router.post("/users/update-role", AdminController.updateUserRole);
router.post("/users/verify", AdminController.verifyUser);
router.post("/users/block", AdminController.blockUser);
router.post("/users/unblock", AdminController.unblockUser);
router.post("/users/delete", AdminController.softDeleteUser);

// Violation management routes
router.get("/violations", AdminController.getAllViolations);
router.post("/violations/update-status", AdminController.updateViolationStatus);

// Analytics routes
router.get("/analytics/system", AdminController.getSystemAnalytics);

// Citizen gem management routes
router.post("/citizens/gems/manage", AdminController.manageCitizenGems);
router.post("/citizens/restriction", AdminController.setCitizenRestriction);
router.get("/citizens/:citizenId/gems", AdminController.getCitizenGems);

// System maintenance routes
router.post("/system/enforce-constraints", AdminController.enforceConstraints);

export default router;
