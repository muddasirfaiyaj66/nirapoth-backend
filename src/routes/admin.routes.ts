import { Router } from "express";
import { authenticateToken } from "../middlewares/auth.middleware";
import { adminOnly } from "../middlewares/security.middleware";
import { AdminController } from "../controllers/admin.controller";

const router = Router();

// All admin routes require authentication and admin role
router.use(authenticateToken);
router.use(adminOnly);

// User management routes
router.post("/users/block", AdminController.blockUser);
router.post("/users/soft-delete", AdminController.softDeleteUser);

// Driver gem management routes
router.post("/drivers/gems/manage", AdminController.manageDriverGems);
router.post("/drivers/restriction", AdminController.setDriverRestriction);
router.get("/drivers/:driverId/gems", AdminController.getDriverGems);

// System maintenance routes
router.post("/system/enforce-constraints", AdminController.enforceConstraints);

export default router;
