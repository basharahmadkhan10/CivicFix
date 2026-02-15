import express from "express";
import { protect, authorize } from "../middlewares/auth.middleware.js";
import * as SupervisorController from "../controllers/supervisor.controller.js";
import { upload } from "../middlewares/upload.middleware.js";
const router = express.Router();
console.log("Loading supervisor routes...");
console.log(
  "Available controller functions:",
  Object.keys(SupervisorController),
);
router.get("/test", (req, res) => {
  res.json({
    success: true,
    message: "Supervisor route is working",
    timestamp: new Date().toISOString(),
  });
});
router.use(protect, authorize("SUPERVISOR"));
router.get("/dashboard", SupervisorController.getSupervisorDashboardStats);
router.get("/officers", SupervisorController.getAvailableOfficers);
router.get("/complaints", SupervisorController.getAssignedComplaints);
router.get(
  "/complaints/pending-verification",
  SupervisorController.getComplaintsPendingVerification,
);
router.patch(
  "/complaints/:id",
  upload.single("image"),
  SupervisorController.updateComplaint,
);
router.patch("/complaints/:id/assign", SupervisorController.assignToOfficer);
router.patch("/complaints/:id/verify", SupervisorController.verifyComplaint);
router.patch("/complaints/:id/reject", SupervisorController.rejectComplaint);

export default router;
