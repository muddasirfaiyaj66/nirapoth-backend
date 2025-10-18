"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const drivingLicense_controller_1 = __importDefault(require("../controllers/drivingLicense.controller"));
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = express_1.default.Router();
// All routes require authentication
router.use(auth_middleware_1.authenticate);
// Citizen routes
router.post("/", drivingLicense_controller_1.default.createLicense);
router.get("/my-license", drivingLicense_controller_1.default.getMyLicense);
router.patch("/:id", drivingLicense_controller_1.default.updateLicense);
router.post("/:id/pay-blacklist-penalty", drivingLicense_controller_1.default.payBlacklistPenalty);
// Admin/Police routes
router.get("/blacklisted", drivingLicense_controller_1.default.getBlacklistedLicenses);
router.get("/by-license-no/:licenseNo", drivingLicense_controller_1.default.getLicenseByLicenseNo);
router.get("/:id", drivingLicense_controller_1.default.getLicenseById);
router.get("/:id/validity", drivingLicense_controller_1.default.checkValidity);
// Police only routes
router.post("/:id/deduct-gems", drivingLicense_controller_1.default.deductGems);
exports.default = router;
