"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.complaintRoutes = void 0;
const express_1 = require("express");
const complaint_controller_1 = require("../controllers/complaint.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const role_middleware_1 = require("../middlewares/role.middleware");
const client_1 = require("@prisma/client");
const router = (0, express_1.Router)();
exports.complaintRoutes = router;
// All routes require authentication
router.use(auth_middleware_1.authenticateToken);
/**
 * @route GET /api/complaints
 * @desc Get all complaints with pagination and filtering
 * @access Private (Police/Admin)
 */
router.get("/", (0, role_middleware_1.roleMiddleware)([client_1.UserRole.ADMIN, client_1.UserRole.POLICE]), complaint_controller_1.ComplaintController.getAllComplaints);
/**
 * @route GET /api/complaints/stats
 * @desc Get complaint statistics
 * @access Private (Police/Admin)
 */
router.get("/stats", (0, role_middleware_1.roleMiddleware)([client_1.UserRole.ADMIN, client_1.UserRole.POLICE]), complaint_controller_1.ComplaintController.getComplaintStats);
/**
 * @route GET /api/complaints/my-complaints
 * @desc Get user's complaints
 * @access Private
 */
router.get("/my-complaints", complaint_controller_1.ComplaintController.getUserComplaints);
/**
 * @route GET /api/complaints/:complaintId
 * @desc Get complaint by ID
 * @access Private
 */
router.get("/:complaintId", complaint_controller_1.ComplaintController.getComplaintById);
/**
 * @route POST /api/complaints
 * @desc Create new complaint
 * @access Private
 */
router.post("/", complaint_controller_1.ComplaintController.createComplaint);
/**
 * @route PUT /api/complaints/:complaintId/status
 * @desc Update complaint status
 * @access Private (Police/Admin)
 */
router.put("/:complaintId/status", (0, role_middleware_1.roleMiddleware)([client_1.UserRole.ADMIN, client_1.UserRole.POLICE]), complaint_controller_1.ComplaintController.updateComplaintStatus);
/**
 * @route POST /api/complaints/assign
 * @desc Assign complaint to police station
 * @access Private (Police/Admin)
 */
router.post("/assign", (0, role_middleware_1.roleMiddleware)([client_1.UserRole.ADMIN, client_1.UserRole.POLICE]), complaint_controller_1.ComplaintController.assignComplaint);
