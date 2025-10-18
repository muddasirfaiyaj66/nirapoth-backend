import express from "express";
import { authenticate } from "../middlewares/auth.middleware";
import * as assignmentController from "../controllers/driverAssignment.controller";

const router = express.Router();

// Assignment management
router.post("/create", authenticate, assignmentController.createAssignment);
router.post("/:id/accept", authenticate, assignmentController.acceptAssignment);
router.post("/:id/reject", authenticate, assignmentController.rejectAssignment);
router.post(
  "/:id/resign",
  authenticate,
  assignmentController.resignFromAssignment
);
router.post(
  "/:id/terminate",
  authenticate,
  assignmentController.terminateAssignment
);

// Get assignments
router.get(
  "/my-assignments",
  authenticate,
  assignmentController.getMyAssignments
);
router.get("/:id", authenticate, assignmentController.getAssignment);
router.get(
  "/vehicle/:vehicleId",
  authenticate,
  assignmentController.getVehicleAssignments
);
router.get("/driver/:driverId", assignmentController.getDriverAssignments);

export default router;
