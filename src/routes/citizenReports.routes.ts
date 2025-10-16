import { Router } from "express";
import { CitizenReportsController } from "../controllers/citizenReports.controller";
import { authenticateToken } from "../middlewares/auth.middleware";

const router = Router();

// All routes require authentication
router.use(authenticateToken);

// Citizen routes
router.get("/my-reports", CitizenReportsController.getMyReports);
router.get("/my-stats", CitizenReportsController.getMyStats);
router.post("/create", CitizenReportsController.createReport);
router.post("/:reportId/appeal", CitizenReportsController.submitAppeal);
router.delete("/:reportId", CitizenReportsController.deleteReport);

export default router;
