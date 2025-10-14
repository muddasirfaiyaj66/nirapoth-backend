import { Router } from "express";
import { CitizenController } from "../controllers/citizen.controller";
import { authenticateToken } from "../middlewares/auth.middleware";
import { roleMiddleware } from "../middlewares/role.middleware";
import { UserRole } from "@prisma/client";
const router = Router();
// All routes require authentication as CITIZEN
router.use(authenticateToken);
router.use(roleMiddleware([UserRole.CITIZEN, UserRole.ADMIN])); // Admin can also access citizen routes
/**
 * @route GET /api/citizen/vehicles
 * @desc Get citizen's vehicles
 * @access Private (Citizen)
 */
router.get("/vehicles", CitizenController.getMyVehicles);
/**
 * @route POST /api/citizen/vehicles
 * @desc Register a new vehicle
 * @access Private (Citizen)
 */
router.post("/vehicles", CitizenController.registerVehicle);
/**
 * @route PUT /api/citizen/vehicles/:vehicleId
 * @desc Update a vehicle
 * @access Private (Citizen)
 */
router.put("/vehicles/:vehicleId", CitizenController.updateVehicle);
/**
 * @route DELETE /api/citizen/vehicles/:vehicleId
 * @desc Delete a vehicle
 * @access Private (Citizen)
 */
router.delete("/vehicles/:vehicleId", CitizenController.deleteVehicle);
/**
 * @route GET /api/citizen/violations
 * @desc Get citizen's violations
 * @access Private (Citizen)
 */
router.get("/violations", CitizenController.getMyViolations);
/**
 * @route GET /api/citizen/violations/:violationId
 * @desc Get violation by ID
 * @access Private (Citizen)
 */
router.get("/violations/:violationId", CitizenController.getViolationById);
/**
 * @route POST /api/citizen/violations/:violationId/appeal
 * @desc Appeal a violation
 * @access Private (Citizen)
 */
router.post("/violations/:violationId/appeal", CitizenController.appealViolation);
/**
 * @route GET /api/citizen/complaints
 * @desc Get citizen's complaints
 * @access Private (Citizen)
 */
router.get("/complaints", CitizenController.getMyComplaints);
/**
 * @route POST /api/citizen/complaints
 * @desc Create a new complaint
 * @access Private (Citizen)
 */
router.post("/complaints", CitizenController.createComplaint);
/**
 * @route PUT /api/citizen/complaints/:complaintId
 * @desc Update a complaint
 * @access Private (Citizen)
 */
router.put("/complaints/:complaintId", CitizenController.updateComplaint);
/**
 * @route GET /api/citizen/payments
 * @desc Get citizen's payments
 * @access Private (Citizen)
 */
router.get("/payments", CitizenController.getMyPayments);
/**
 * @route POST /api/citizen/payments
 * @desc Create a payment
 * @access Private (Citizen)
 */
router.post("/payments", CitizenController.createPayment);
/**
 * @route GET /api/citizen/profile
 * @desc Get citizen's profile
 * @access Private (Citizen)
 */
router.get("/profile", CitizenController.getMyProfile);
/**
 * @route PUT /api/citizen/profile
 * @desc Update citizen's profile
 * @access Private (Citizen)
 */
router.put("/profile", CitizenController.updateMyProfile);
/**
 * @route GET /api/citizen/gems
 * @desc Get citizen's gems
 * @access Private (Citizen)
 */
router.get("/gems", CitizenController.getMyGems);
/**
 * @route GET /api/citizen/emergency-contacts
 * @desc Get emergency contacts
 * @access Private (Citizen)
 */
router.get("/emergency-contacts", CitizenController.getEmergencyContacts);
export { router as citizenRoutes };
