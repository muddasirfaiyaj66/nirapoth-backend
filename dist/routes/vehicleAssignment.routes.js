"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const vehicleAssignment_controller_1 = require("../controllers/vehicleAssignment.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = (0, express_1.Router)();
// All routes require authentication
router.use(auth_middleware_1.authenticateToken);
/**
 * @route POST /api/vehicle-assignment/assign
 * @desc Assign driver to vehicle
 * @access Private
 */
router.post("/assign", vehicleAssignment_controller_1.VehicleAssignmentController.assignDriver);
/**
 * @route POST /api/vehicle-assignment/unassign
 * @desc Unassign driver from vehicle
 * @access Private
 */
router.post("/unassign", vehicleAssignment_controller_1.VehicleAssignmentController.unassignDriver);
/**
 * @route GET /api/vehicle-assignment/vehicle/:vehicleId
 * @desc Get assignments for a vehicle
 * @access Private
 */
router.get("/vehicle/:vehicleId", vehicleAssignment_controller_1.VehicleAssignmentController.getVehicleAssignments);
/**
 * @route GET /api/vehicle-assignment/citizen/:citizenId
 * @desc Get assignments for a citizen
 * @access Private
 */
router.get("/citizen/:citizenId", vehicleAssignment_controller_1.VehicleAssignmentController.getCitizenAssignments);
/**
 * @route PUT /api/vehicle-assignment/:assignmentId/approve
 * @desc Approve vehicle assignment
 * @access Private (Admin/Organization)
 */
router.put("/:assignmentId/approve", vehicleAssignment_controller_1.VehicleAssignmentController.approveAssignment);
/**
 * @route GET /api/vehicle-assignment/eligibility/:citizenId/:vehicleId
 * @desc Check driving eligibility
 * @access Private
 */
router.get("/eligibility/:citizenId/:vehicleId", vehicleAssignment_controller_1.VehicleAssignmentController.checkDrivingEligibility);
/**
 * @route GET /api/vehicle-assignment/expiring
 * @desc Get expiring assignments
 * @access Private
 */
router.get("/expiring", vehicleAssignment_controller_1.VehicleAssignmentController.getExpiringAssignments);
exports.default = router;
