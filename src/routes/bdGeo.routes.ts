import express from "express";
import {
  getDivisions,
  getDistricts,
  getUpazilas,
  searchGeoLocations,
  populateGeoData,
} from "../controllers/bdGeo.controller";
import { authenticate } from "../middlewares/auth.middleware";
import { roleMiddleware } from "../middlewares/role.middleware";

const router = express.Router();

/**
 * Public routes - No authentication required
 * These routes are used by registration/profile forms
 */

// Get all divisions
router.get("/divisions", getDivisions);

// Get districts (all or by division)
router.get("/districts", getDistricts);

// Get upazilas (all or by district)
router.get("/upazilas", getUpazilas);

// Search locations
router.get("/search", searchGeoLocations);

/**
 * Admin-only routes
 */

// Populate geographical data from BD API (Admin only)
router.post(
  "/populate",
  authenticate,
  roleMiddleware(["ADMIN", "SUPER_ADMIN"]),
  populateGeoData
);

export default router;
