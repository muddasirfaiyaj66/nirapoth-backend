"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const drivingLicense_routes_1 = __importDefault(require("./drivingLicense.routes"));
const vehicleAssignment_routes_1 = __importDefault(require("./vehicleAssignment.routes"));
const userProfile_routes_1 = __importDefault(require("./userProfile.routes"));
const policeManagement_routes_1 = __importDefault(require("./policeManagement.routes"));
const vehicle_routes_1 = __importDefault(require("./vehicle.routes"));
const camera_routes_1 = __importDefault(require("./camera.routes"));
const rewards_routes_1 = __importDefault(require("./rewards.routes"));
const router = express_1.default.Router();
// API Routes
router.use("/driving-license", drivingLicense_routes_1.default);
router.use("/vehicle-assignment", vehicleAssignment_routes_1.default);
router.use("/vehicles", vehicle_routes_1.default);
router.use("/profile", userProfile_routes_1.default);
router.use("/police", policeManagement_routes_1.default);
router.use("/cameras", camera_routes_1.default);
router.use("/rewards", rewards_routes_1.default);
exports.default = router;
