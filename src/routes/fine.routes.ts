import { Router } from "express";
import { FineController } from "../controllers/fine.controller";
import { authenticateToken } from "../middlewares/auth.middleware";
import { roleMiddleware } from "../middlewares/role.middleware";
import { UserRole } from "@prisma/client";

const router = Router();

// All routes require authentication
router.use(authenticateToken);

/**
 * @route GET /api/fines
 * @desc Get all fines with pagination and filtering
 * @access Private (Super Admin/Admin/Police)
 */
router.get(
  "/",
  roleMiddleware([UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.POLICE]),
  FineController.getAllFines
);

/**
 * @route GET /api/fines/stats
 * @desc Get fine statistics
 * @access Private (Super Admin/Admin/Police)
 */
router.get(
  "/stats",
  roleMiddleware([UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.POLICE]),
  FineController.getFineStats
);

/**
 * @route GET /api/fines/overdue
 * @desc Get overdue fines
 * @access Private (Super Admin/Admin/Police)
 */
router.get(
  "/overdue",
  roleMiddleware([UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.POLICE]),
  FineController.getOverdueFines
);

/**
 * @route GET /api/fines/my-fines
 * @desc Get user's fines
 * @access Private (All authenticated users)
 */
router.get(
  "/my-fines",
  roleMiddleware([
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.POLICE,
    UserRole.FIRE_SERVICE,
    UserRole.CITIZEN,
  ]),
  FineController.getUserFines
);

/**
 * @route GET /api/fines/:fineId
 * @desc Get fine by ID
 * @access Private (Super Admin/Admin/Police)
 */
router.get(
  "/:fineId",
  roleMiddleware([UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.POLICE]),
  FineController.getFineById
);

/**
 * @route POST /api/fines
 * @desc Create new fine
 * @access Private (Super Admin/Admin/Police)
 */
router.post(
  "/",
  roleMiddleware([UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.POLICE]),
  FineController.createFine
);

/**
 * @route PUT /api/fines/:fineId
 * @desc Update fine
 * @access Private (Super Admin/Admin/Police)
 */
router.put(
  "/:fineId",
  roleMiddleware([UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.POLICE]),
  FineController.updateFine
);

/**
 * @route DELETE /api/fines/:fineId
 * @desc Delete fine
 * @access Private (Super Admin/Admin only)
 */
router.delete(
  "/:fineId",
  roleMiddleware([UserRole.SUPER_ADMIN, UserRole.ADMIN]),
  FineController.deleteFine
);

export { router as fineRoutes };

