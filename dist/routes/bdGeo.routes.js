"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const bdGeo_controller_1 = require("../controllers/bdGeo.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const role_middleware_1 = require("../middlewares/role.middleware");
const router = express_1.default.Router();
/**
 * Public routes - No authentication required
 * These routes are used by registration/profile forms
 */
// Get all divisions
router.get("/divisions", bdGeo_controller_1.getDivisions);
// Get districts (all or by division)
router.get("/districts", bdGeo_controller_1.getDistricts);
// Get upazilas (all or by district)
router.get("/upazilas", bdGeo_controller_1.getUpazilas);
// Search locations
router.get("/search", bdGeo_controller_1.searchGeoLocations);
/**
 * Admin-only routes
 */
// Populate geographical data from BD API (Admin only)
router.post("/populate", auth_middleware_1.authenticate, (0, role_middleware_1.roleMiddleware)(["ADMIN", "SUPER_ADMIN"]), bdGeo_controller_1.populateGeoData);
exports.default = router;
