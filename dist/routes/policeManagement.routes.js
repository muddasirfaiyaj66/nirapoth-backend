"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const policeManagement_controller_1 = require("../controllers/policeManagement.controller");
const citizenReports_controller_1 = require("../controllers/citizenReports.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const role_middleware_1 = require("../middlewares/role.middleware");
const router = (0, express_1.Router)();
// All routes require authentication
router.use(auth_middleware_1.authenticateToken);
/**
 * @route POST /api/police/officer
 * @desc Create new police officer
 * @access Private (Admin/HQ only)
 */
router.post("/officer", policeManagement_controller_1.PoliceManagementController.createPoliceOfficer);
/**
 * @route POST /api/police/station
 * @desc Create new police station
 * @access Private (Admin/HQ only)
 */
router.post("/station", policeManagement_controller_1.PoliceManagementController.createPoliceStation);
/**
 * @route POST /api/police/assign
 * @desc Assign police officer to station
 * @access Private (Admin/HQ only)
 */
router.post("/assign", policeManagement_controller_1.PoliceManagementController.assignPoliceToStation);
/**
 * @route GET /api/police/station/:stationId/officers
 * @desc Get officers by station
 * @access Private
 */
router.get("/station/:stationId/officers", policeManagement_controller_1.PoliceManagementController.getOfficersByStation);
/**
 * @route GET /api/police/station/:stationId/hierarchy
 * @desc Get station hierarchy
 * @access Private
 */
router.get("/station/:stationId/hierarchy", policeManagement_controller_1.PoliceManagementController.getStationHierarchy);
/**
 * @route PUT /api/police/officer/:officerId/rank
 * @desc Update officer rank
 * @access Private (Admin/Superior only)
 */
router.put("/officer/:officerId/rank", policeManagement_controller_1.PoliceManagementController.updateOfficerRank);
/**
 * @route POST /api/police/station/oc
 * @desc Set station Officer-in-Charge
 * @access Private (Admin/HQ only)
 */
router.post("/station/oc", policeManagement_controller_1.PoliceManagementController.setStationOC);
/**
 * @route GET /api/police/search
 * @desc Search police officers
 * @access Private
 */
router.get("/search", policeManagement_controller_1.PoliceManagementController.searchOfficers);
/**
 * @route PUT /api/police/transfer/:policeId
 * @desc Transfer police officer
 * @access Private (Admin/HQ only)
 */
router.put("/transfer/:policeId", policeManagement_controller_1.PoliceManagementController.transferPoliceOfficer);
/**
 * @route GET /api/police/statistics
 * @desc Get police statistics
 * @access Private
 */
router.get("/statistics", policeManagement_controller_1.PoliceManagementController.getPoliceStatistics);
/**
 * @route GET /api/police/pending-reports
 * @desc Get pending citizen reports for review
 * @access Private (Police/Admin/Super Admin only)
 */
router.get("/pending-reports", (0, role_middleware_1.roleMiddleware)(["POLICE", "ADMIN", "SUPER_ADMIN"]), citizenReports_controller_1.CitizenReportsController.getPendingReports);
/**
 * @route GET /api/police/review-stats
 * @desc Get review statistics for police dashboard
 * @access Private (Police/Admin/Super Admin only)
 */
router.get("/review-stats", (0, role_middleware_1.roleMiddleware)(["POLICE", "ADMIN", "SUPER_ADMIN"]), citizenReports_controller_1.CitizenReportsController.getReviewStats);
/**
 * @route GET /api/police/pending-appeals
 * @desc Get pending appeals for review
 * @access Private (Police/Admin/Super Admin only)
 */
router.get("/pending-appeals", (0, role_middleware_1.roleMiddleware)(["POLICE", "ADMIN", "SUPER_ADMIN"]), citizenReports_controller_1.CitizenReportsController.getPendingAppeals);
/**
 * @route POST /api/police/review-appeal/:reportId
 * @desc Review appeal (approve/reject)
 * @access Private (Police/Admin/Super Admin only)
 */
router.post("/review-appeal/:reportId", (0, role_middleware_1.roleMiddleware)(["POLICE", "ADMIN", "SUPER_ADMIN"]), citizenReports_controller_1.CitizenReportsController.reviewAppeal);
/**
 * @route POST /api/police/review/:reportId
 * @desc Review citizen report (approve/reject)
 * @access Private (Police/Admin/Super Admin only)
 */
router.post("/review/:reportId", (0, role_middleware_1.roleMiddleware)(["POLICE", "ADMIN", "SUPER_ADMIN"]), citizenReports_controller_1.CitizenReportsController.reviewReport);
exports.default = router;
