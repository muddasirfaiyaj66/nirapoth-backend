import { Router } from "express";
import { ComplaintController } from "../controllers/complaint.controller";
import { authenticateToken } from "../middlewares/auth.middleware";
import { roleMiddleware } from "../middlewares/role.middleware";
import { UserRole } from "@prisma/client";

const router = Router();

// All routes require authentication
router.use(authenticateToken);

/**
 * @route GET /api/complaints
 * @desc Get all complaints with pagination and filtering
 * @access Private (Police/Admin)
 */
router.get(
  "/",
  roleMiddleware([UserRole.ADMIN, UserRole.POLICE]),
  ComplaintController.getAllComplaints
);

/**
 * @route GET /api/complaints/stats
 * @desc Get complaint statistics
 * @access Private (Police/Admin)
 */
router.get(
  "/stats",
  roleMiddleware([UserRole.ADMIN, UserRole.POLICE]),
  ComplaintController.getComplaintStats
);

/**
 * @route GET /api/complaints/my-complaints
 * @desc Get user's complaints
 * @access Private
 */
router.get("/my-complaints", ComplaintController.getUserComplaints);

/**
 * @route GET /api/complaints/:complaintId
 * @desc Get complaint by ID
 * @access Private
 */
router.get("/:complaintId", ComplaintController.getComplaintById);

/**
 * @route POST /api/complaints
 * @desc Create new complaint
 * @access Private
 */
router.post("/", ComplaintController.createComplaint);

/**
 * @route PUT /api/complaints/:complaintId/status
 * @desc Update complaint status
 * @access Private (Police/Admin)
 */
router.put(
  "/:complaintId/status",
  roleMiddleware([UserRole.ADMIN, UserRole.POLICE]),
  ComplaintController.updateComplaintStatus
);

/**
 * @route POST /api/complaints/assign
 * @desc Assign complaint to police station
 * @access Private (Police/Admin)
 */
router.post(
  "/assign",
  roleMiddleware([UserRole.ADMIN, UserRole.POLICE]),
  ComplaintController.assignComplaint
);

export { router as complaintRoutes };
