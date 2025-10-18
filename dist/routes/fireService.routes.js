"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.fireServiceRoutes = void 0;
const express_1 = __importDefault(require("express"));
const fireService_controller_1 = require("../controllers/fireService.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = express_1.default.Router();
exports.fireServiceRoutes = router;
// All routes require authentication
router.use(auth_middleware_1.authenticateToken);
// =====================
// FIRE INCIDENTS
// =====================
/**
 * @route POST /api/fire-service/incidents
 * @desc Create a new fire incident (Emergency report)
 * @access Public (Any authenticated user can report)
 */
router.post("/incidents", fireService_controller_1.createIncident);
/**
 * @route GET /api/fire-service/incidents
 * @desc Get all fire incidents with filters
 * @access Private (Fire Service, Admin)
 */
router.get("/incidents", fireService_controller_1.getAllIncidents);
/**
 * @route GET /api/fire-service/incidents/:id
 * @desc Get single fire incident
 * @access Private (Fire Service, Admin, Reporter)
 */
router.get("/incidents/:id", fireService_controller_1.getIncidentById);
/**
 * @route PATCH /api/fire-service/incidents/:id/status
 * @desc Update fire incident status
 * @access Private (Fire Service, Admin)
 */
router.patch("/incidents/:id/status", fireService_controller_1.updateIncidentStatus);
/**
 * @route POST /api/fire-service/incidents/:id/assign
 * @desc Assign team members to incident
 * @access Private (Fire Service, Admin)
 */
router.post("/incidents/:id/assign", fireService_controller_1.assignTeamMembers);
/**
 * @route POST /api/fire-service/incidents/:id/equipment
 * @desc Deploy equipment to incident
 * @access Private (Fire Service, Admin)
 */
router.post("/incidents/:id/equipment", fireService_controller_1.deployEquipment);
/**
 * @route GET /api/fire-service/statistics
 * @desc Get fire service statistics
 * @access Private (Fire Service, Admin)
 */
router.get("/statistics", fireService_controller_1.getFireStatistics);
// =====================
// FIRE TEAM
// =====================
/**
 * @route GET /api/fire-service/team
 * @desc Get all fire team members
 * @access Private (Fire Service, Admin)
 */
router.get("/team", fireService_controller_1.getAllTeamMembers);
/**
 * @route GET /api/fire-service/team/available
 * @desc Get available team members
 * @access Private (Fire Service, Admin)
 */
router.get("/team/available", fireService_controller_1.getAvailableTeamMembers);
/**
 * @route GET /api/fire-service/team/statistics
 * @desc Get team statistics
 * @access Private (Fire Service, Admin)
 */
router.get("/team/statistics", fireService_controller_1.getTeamStatistics);
/**
 * @route GET /api/fire-service/team/:id
 * @desc Get team member by ID
 * @access Private (Fire Service, Admin)
 */
router.get("/team/:id", fireService_controller_1.getTeamMemberById);
/**
 * @route PATCH /api/fire-service/team/:id/status
 * @desc Update team member status
 * @access Private (Fire Service, Admin)
 */
router.patch("/team/:id/status", fireService_controller_1.updateTeamMemberStatus);
