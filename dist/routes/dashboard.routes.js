import { Router } from "express";
import { authenticateToken } from "../middlewares/auth.middleware";
import { DashboardController } from "../controllers/dashboard.controller";
const router = Router();
// All dashboard routes require authentication
router.use(authenticateToken);
/**
 * @route   GET /api/dashboard/stats
 * @desc    Get dashboard statistics
 * @access  Private (All authenticated users)
 */
router.get("/stats", DashboardController.getDashboardStats);
/**
 * @route   GET /api/dashboard/violations
 * @desc    Get violation data over time
 * @access  Private (All authenticated users)
 */
router.get("/violations", DashboardController.getViolationData);
/**
 * @route   GET /api/dashboard/revenue
 * @desc    Get revenue data over time
 * @access  Private (All authenticated users)
 */
router.get("/revenue", DashboardController.getRevenueData);
/**
 * @route   GET /api/dashboard/road-congestion
 * @desc    Get road congestion data
 * @access  Private (All authenticated users)
 */
router.get("/road-congestion", DashboardController.getRoadCongestionData);
/**
 * @route   GET /api/dashboard/police-stations
 * @desc    Get police station data
 * @access  Private (All authenticated users)
 */
router.get("/police-stations", DashboardController.getPoliceStationData);
/**
 * @route   GET /api/dashboard/user-submissions
 * @desc    Get user submission data
 * @access  Private (All authenticated users)
 */
router.get("/user-submissions", DashboardController.getUserSubmissionData);
/**
 * @route   GET /api/dashboard/user-roles
 * @desc    Get user role distribution data
 * @access  Private (All authenticated users)
 */
router.get("/user-roles", DashboardController.getUserRoleData);
/**
 * @route   GET /api/dashboard/violation-types
 * @desc    Get violation type data
 * @access  Private (All authenticated users)
 */
router.get("/violation-types", DashboardController.getViolationTypeData);
/**
 * @route   GET /api/dashboard/case-sources
 * @desc    Get case source data
 * @access  Private (All authenticated users)
 */
router.get("/case-sources", DashboardController.getCaseSourceData);
/**
 * @route   GET /api/dashboard/complaint-status
 * @desc    Get complaint status data
 * @access  Private (All authenticated users)
 */
router.get("/complaint-status", DashboardController.getComplaintStatusData);
/**
 * @route   GET /api/dashboard/fine-status
 * @desc    Get fine status data
 * @access  Private (All authenticated users)
 */
router.get("/fine-status", DashboardController.getFineStatusData);
/**
 * @route   GET /api/dashboard/emergencies
 * @desc    Get emergency response data
 * @access  Private (All authenticated users)
 */
router.get("/emergencies", DashboardController.getEmergencyResponseData);
/**
 * @route   GET /api/dashboard/top-citizens
 * @desc    Get top citizens data
 * @access  Private (All authenticated users)
 */
router.get("/top-citizens", DashboardController.getTopCitizensData);
export default router;
