"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_middleware_1 = require("../middlewares/auth.middleware");
const dashboard_controller_1 = require("../controllers/dashboard.controller");
const router = express_1.default.Router();
// All dashboard routes require authentication
router.use(auth_middleware_1.authenticateToken);
/**
 * @route   GET /api/dashboard/stats
 * @desc    Get dashboard statistics
 * @access  Private (All authenticated users)
 */
router.get("/stats", dashboard_controller_1.DashboardController.getDashboardStats);
/**
 * @route   GET /api/dashboard/violations
 * @desc    Get violation data over time
 * @access  Private (All authenticated users)
 */
router.get("/violations", dashboard_controller_1.DashboardController.getViolationData);
/**
 * @route   GET /api/dashboard/revenue
 * @desc    Get revenue data over time
 * @access  Private (All authenticated users)
 */
router.get("/revenue", dashboard_controller_1.DashboardController.getRevenueData);
/**
 * @route   GET /api/dashboard/road-congestion
 * @desc    Get road congestion data
 * @access  Private (All authenticated users)
 */
router.get("/road-congestion", dashboard_controller_1.DashboardController.getRoadCongestionData);
/**
 * @route   GET /api/dashboard/police-stations
 * @desc    Get police station data
 * @access  Private (All authenticated users)
 */
router.get("/police-stations", dashboard_controller_1.DashboardController.getPoliceStationData);
/**
 * @route   GET /api/dashboard/user-submissions
 * @desc    Get user submission data
 * @access  Private (All authenticated users)
 */
router.get("/user-submissions", dashboard_controller_1.DashboardController.getUserSubmissionData);
/**
 * @route   GET /api/dashboard/user-roles
 * @desc    Get user role distribution data
 * @access  Private (All authenticated users)
 */
router.get("/user-roles", dashboard_controller_1.DashboardController.getUserRoleData);
/**
 * @route   GET /api/dashboard/violation-types
 * @desc    Get violation type data
 * @access  Private (All authenticated users)
 */
router.get("/violation-types", dashboard_controller_1.DashboardController.getViolationTypeData);
/**
 * @route   GET /api/dashboard/case-sources
 * @desc    Get case source data
 * @access  Private (All authenticated users)
 */
router.get("/case-sources", dashboard_controller_1.DashboardController.getCaseSourceData);
/**
 * @route   GET /api/dashboard/complaint-status
 * @desc    Get complaint status data
 * @access  Private (All authenticated users)
 */
router.get("/complaint-status", dashboard_controller_1.DashboardController.getComplaintStatusData);
/**
 * @route   GET /api/dashboard/fine-status
 * @desc    Get fine status data
 * @access  Private (All authenticated users)
 */
router.get("/fine-status", dashboard_controller_1.DashboardController.getFineStatusData);
/**
 * @route   GET /api/dashboard/emergencies
 * @desc    Get emergency response data
 * @access  Private (All authenticated users)
 */
router.get("/emergencies", dashboard_controller_1.DashboardController.getEmergencyResponseData);
/**
 * @route   GET /api/dashboard/top-citizens
 * @desc    Get top citizens data
 * @access  Private (All authenticated users)
 */
router.get("/top-citizens", dashboard_controller_1.DashboardController.getTopCitizensData);
exports.default = router;
