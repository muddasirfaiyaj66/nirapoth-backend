import express from "express";
import { VehicleAssignmentController } from "../controllers/vehicleAssignment.controller";
import { authenticateToken } from "../middlewares/auth.middleware";

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

/**
 * @route POST /api/vehicle-assignment/assign
 * @desc Assign driver to vehicle
 * @access Private
 */
router.post("/assign", VehicleAssignmentController.assignDriver);

/**
 * @route POST /api/vehicle-assignment/unassign
 * @desc Unassign driver from vehicle
 * @access Private
 */
router.post("/unassign", VehicleAssignmentController.unassignDriver);

/**
 * @route GET /api/vehicle-assignment/vehicle/:vehicleId
 * @desc Get assignments for a vehicle
 * @access Private
 */
router.get(
  "/vehicle/:vehicleId",
  VehicleAssignmentController.getVehicleAssignments
);

/**
 * @route GET /api/vehicle-assignment/citizen/:citizenId
 * @desc Get assignments for a citizen
 * @access Private
 */
router.get(
  "/citizen/:citizenId",
  VehicleAssignmentController.getCitizenAssignments
);

/**
 * @route PUT /api/vehicle-assignment/:assignmentId/approve
 * @desc Approve vehicle assignment
 * @access Private (Admin/Organization)
 */
router.put(
  "/:assignmentId/approve",
  VehicleAssignmentController.approveAssignment
);

/**
 * @route GET /api/vehicle-assignment/eligibility/:citizenId/:vehicleId
 * @desc Check driving eligibility
 * @access Private
 */
router.get(
  "/eligibility/:citizenId/:vehicleId",
  VehicleAssignmentController.checkDrivingEligibility
);

/**
 * @route GET /api/vehicle-assignment/expiring
 * @desc Get expiring assignments
 * @access Private
 */
router.get("/expiring", VehicleAssignmentController.getExpiringAssignments);

export default router;
