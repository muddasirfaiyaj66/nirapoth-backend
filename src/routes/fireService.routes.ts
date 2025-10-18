import express from "express";
import {
  createIncident,
  getAllIncidents,
  getIncidentById,
  updateIncidentStatus,
  assignTeamMembers,
  deployEquipment,
  getFireStatistics,
  getAllTeamMembers,
  getAvailableTeamMembers,
  getTeamMemberById,
  updateTeamMemberStatus,
  getTeamStatistics,
} from "../controllers/fireService.controller";
import { authenticateToken } from "../middlewares/auth.middleware";

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// =====================
// FIRE INCIDENTS
// =====================

/**
 * @route POST /api/fire-service/incidents
 * @desc Create a new fire incident (Emergency report)
 * @access Public (Any authenticated user can report)
 */
router.post("/incidents", createIncident);

/**
 * @route GET /api/fire-service/incidents
 * @desc Get all fire incidents with filters
 * @access Private (Fire Service, Admin)
 */
router.get("/incidents", getAllIncidents);

/**
 * @route GET /api/fire-service/incidents/:id
 * @desc Get single fire incident
 * @access Private (Fire Service, Admin, Reporter)
 */
router.get("/incidents/:id", getIncidentById);

/**
 * @route PATCH /api/fire-service/incidents/:id/status
 * @desc Update fire incident status
 * @access Private (Fire Service, Admin)
 */
router.patch("/incidents/:id/status", updateIncidentStatus);

/**
 * @route POST /api/fire-service/incidents/:id/assign
 * @desc Assign team members to incident
 * @access Private (Fire Service, Admin)
 */
router.post("/incidents/:id/assign", assignTeamMembers);

/**
 * @route POST /api/fire-service/incidents/:id/equipment
 * @desc Deploy equipment to incident
 * @access Private (Fire Service, Admin)
 */
router.post("/incidents/:id/equipment", deployEquipment);

/**
 * @route GET /api/fire-service/statistics
 * @desc Get fire service statistics
 * @access Private (Fire Service, Admin)
 */
router.get("/statistics", getFireStatistics);

// =====================
// FIRE TEAM
// =====================

/**
 * @route GET /api/fire-service/team
 * @desc Get all fire team members
 * @access Private (Fire Service, Admin)
 */
router.get("/team", getAllTeamMembers);

/**
 * @route GET /api/fire-service/team/available
 * @desc Get available team members
 * @access Private (Fire Service, Admin)
 */
router.get("/team/available", getAvailableTeamMembers);

/**
 * @route GET /api/fire-service/team/statistics
 * @desc Get team statistics
 * @access Private (Fire Service, Admin)
 */
router.get("/team/statistics", getTeamStatistics);

/**
 * @route GET /api/fire-service/team/:id
 * @desc Get team member by ID
 * @access Private (Fire Service, Admin)
 */
router.get("/team/:id", getTeamMemberById);

/**
 * @route PATCH /api/fire-service/team/:id/status
 * @desc Update team member status
 * @access Private (Fire Service, Admin)
 */
router.patch("/team/:id/status", updateTeamMemberStatus);

export { router as fireServiceRoutes };
