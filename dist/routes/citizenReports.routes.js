"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const citizenReports_controller_1 = require("../controllers/citizenReports.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = (0, express_1.Router)();
// All routes require authentication
router.use(auth_middleware_1.authenticateToken);
// Citizen routes
router.get("/my-reports", citizenReports_controller_1.CitizenReportsController.getMyReports);
router.get("/my-stats", citizenReports_controller_1.CitizenReportsController.getMyStats);
router.post("/create", citizenReports_controller_1.CitizenReportsController.createReport);
router.post("/:reportId/appeal", citizenReports_controller_1.CitizenReportsController.submitAppeal);
router.delete("/:reportId", citizenReports_controller_1.CitizenReportsController.deleteReport);
exports.default = router;
