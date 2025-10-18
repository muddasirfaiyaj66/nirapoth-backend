import { Router } from "express";
import VehicleController from "../controllers/vehicle.controller";
import { authenticate } from "../middlewares/auth.middleware";
const router = Router();
// All routes require authentication
router.use(authenticate);
// Citizen routes
router.post("/", VehicleController.createVehicle);
router.get("/my-vehicles", VehicleController.getMyVehicles);
router.patch("/:id", VehicleController.updateVehicle);
router.delete("/:id", VehicleController.deleteVehicle);
// Admin/Police routes
router.get("/search", VehicleController.searchVehicles);
router.get("/by-plate/:plateNo", VehicleController.getVehicleByPlateNo);
router.get("/:id", VehicleController.getVehicleById);
router.get("/:id/stats", VehicleController.getVehicleStats);
export default router;
