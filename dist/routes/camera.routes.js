"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const camera_controller_1 = require("../controllers/camera.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = express_1.default.Router();
// Apply authentication middleware to all routes
router.use(auth_middleware_1.authenticateToken);
// Camera CRUD routes
router.get("/", camera_controller_1.CameraController.getCameras);
router.get("/stats", camera_controller_1.CameraController.getCameraStats);
router.get("/locations", camera_controller_1.CameraController.getLocations);
router.get("/stations", camera_controller_1.CameraController.getPoliceStations);
router.get("/:id", camera_controller_1.CameraController.getCameraById);
router.post("/", camera_controller_1.CameraController.createCamera);
router.put("/:id", camera_controller_1.CameraController.updateCamera);
router.patch("/:id/status", camera_controller_1.CameraController.updateCameraStatus);
router.delete("/:id", camera_controller_1.CameraController.deleteCamera);
exports.default = router;
