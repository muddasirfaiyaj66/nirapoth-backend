import express from "express";
import { CameraController } from "../controllers/camera.controller";
import { authenticateToken } from "../middlewares/auth.middleware";
const router = express.Router();
// Apply authentication middleware to all routes
router.use(authenticateToken);
// Camera CRUD routes
router.get("/", CameraController.getCameras);
router.get("/stats", CameraController.getCameraStats);
router.get("/locations", CameraController.getLocations);
router.get("/stations", CameraController.getPoliceStations);
router.get("/:id", CameraController.getCameraById);
router.post("/", CameraController.createCamera);
router.put("/:id", CameraController.updateCamera);
router.patch("/:id/status", CameraController.updateCameraStatus);
router.delete("/:id", CameraController.deleteCamera);
export default router;
