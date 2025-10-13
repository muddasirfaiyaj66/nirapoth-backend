import { Router } from "express";
import { PoliceManagementController } from "../controllers/policeManagement.controller";
import { authenticateToken } from "../middlewares/auth.middleware";
const router = Router();
// All routes require authentication
router.use(authenticateToken);
/**
 * @route POST /api/police/officer
 * @desc Create new police officer
 * @access Private (Admin/HQ only)
 */
router.post("/officer", PoliceManagementController.createPoliceOfficer);
/**
 * @route POST /api/police/station
 * @desc Create new police station
 * @access Private (Admin/HQ only)
 */
router.post("/station", PoliceManagementController.createPoliceStation);
/**
 * @route POST /api/police/assign
 * @desc Assign police officer to station
 * @access Private (Admin/HQ only)
 */
router.post("/assign", PoliceManagementController.assignPoliceToStation);
/**
 * @route GET /api/police/station/:stationId/officers
 * @desc Get officers by station
 * @access Private
 */
router.get("/station/:stationId/officers", PoliceManagementController.getOfficersByStation);
/**
 * @route GET /api/police/station/:stationId/hierarchy
 * @desc Get station hierarchy
 * @access Private
 */
router.get("/station/:stationId/hierarchy", PoliceManagementController.getStationHierarchy);
/**
 * @route PUT /api/police/officer/:officerId/rank
 * @desc Update officer rank
 * @access Private (Admin/Superior only)
 */
router.put("/officer/:officerId/rank", PoliceManagementController.updateOfficerRank);
/**
 * @route POST /api/police/station/oc
 * @desc Set station Officer-in-Charge
 * @access Private (Admin/HQ only)
 */
router.post("/station/oc", PoliceManagementController.setStationOC);
/**
 * @route GET /api/police/search
 * @desc Search police officers
 * @access Private
 */
router.get("/search", PoliceManagementController.searchOfficers);
/**
 * @route PUT /api/police/transfer/:policeId
 * @desc Transfer police officer
 * @access Private (Admin/HQ only)
 */
router.put("/transfer/:policeId", PoliceManagementController.transferPoliceOfficer);
/**
 * @route GET /api/police/statistics
 * @desc Get police statistics
 * @access Private
 */
router.get("/statistics", PoliceManagementController.getPoliceStatistics);
export default router;
