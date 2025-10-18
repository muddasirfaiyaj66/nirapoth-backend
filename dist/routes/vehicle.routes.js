"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const vehicle_controller_1 = __importDefault(require("../controllers/vehicle.controller"));
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = express_1.default.Router();
// All routes require authentication
router.use(auth_middleware_1.authenticate);
// Citizen routes
router.post("/", vehicle_controller_1.default.createVehicle);
router.get("/my-vehicles", vehicle_controller_1.default.getMyVehicles);
router.patch("/:id", vehicle_controller_1.default.updateVehicle);
router.delete("/:id", vehicle_controller_1.default.deleteVehicle);
// Admin/Police routes
router.get("/search", vehicle_controller_1.default.searchVehicles);
router.get("/by-plate/:plateNo", vehicle_controller_1.default.getVehicleByPlateNo);
router.get("/:id", vehicle_controller_1.default.getVehicleById);
router.get("/:id/stats", vehicle_controller_1.default.getVehicleStats);
exports.default = router;
