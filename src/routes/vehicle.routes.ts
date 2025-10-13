import { Router } from "express";
import { VehicleController } from "../controllers/vehicle.controller";
import { authenticateToken } from "../middlewares/auth.middleware";
import { roleMiddleware } from "../middlewares/role.middleware";
import { UserRole } from "@prisma/client";

const router = Router();

// All routes require authentication
router.use(authenticateToken);

/**
 * @route GET /api/vehicles
 * @desc Get all vehicles (Admin/Police only)
 * @access Private
 */
router.get(
  "/",
  roleMiddleware([UserRole.ADMIN, UserRole.POLICE]),
  VehicleController.getAllVehicles
);

/**
 * @route GET /api/vehicles/my-vehicles
 * @desc Get user's vehicles
 * @access Private
 */
router.get("/my-vehicles", VehicleController.getMyVehicles);

/**
 * @route GET /api/vehicles/:vehicleId
 * @desc Get vehicle by ID
 * @access Private
 */
router.get("/:vehicleId", VehicleController.getVehicleById);

/**
 * @route POST /api/vehicles
 * @desc Add new vehicle
 * @access Private
 */
router.post("/", VehicleController.addVehicle);

/**
 * @route PUT /api/vehicles/:vehicleId
 * @desc Update vehicle
 * @access Private
 */
router.put("/:vehicleId", VehicleController.updateVehicle);

/**
 * @route DELETE /api/vehicles/:vehicleId
 * @desc Delete vehicle
 * @access Private
 */
router.delete("/:vehicleId", VehicleController.deleteVehicle);

/**
 * @route GET /api/vehicles/:vehicleId/history
 * @desc Get vehicle assignment history
 * @access Private
 */
router.get("/:vehicleId/history", VehicleController.getVehicleHistory);

/**
 * @route POST /api/vehicles/:vehicleId/assign-self
 * @desc Assign self as driver to vehicle
 * @access Private (Citizens only)
 */
router.post(
  "/:vehicleId/assign-self",
  roleMiddleware([UserRole.CITIZEN]),
  VehicleController.assignSelfAsDriver
);

/**
 * @route GET /api/vehicles/search
 * @desc Search vehicles by registration, engine, or chassis number
 * @access Private (Police/Admin)
 */
router.get(
  "/search",
  roleMiddleware([UserRole.ADMIN, UserRole.POLICE]),
  VehicleController.searchVehicles
);

export { router as vehicleRoutes };
