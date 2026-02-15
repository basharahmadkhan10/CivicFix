import express from "express";
import { protect, authorize } from "../middlewares/auth.middleware.js";
import * as OfficerController from "../controllers/officer.controller.js";
import { upload } from "../middlewares/upload.middleware.js";
const router = express.Router();
router.use(protect, authorize("OFFICER"));
router.get("/dashboard", OfficerController.getOfficerDashboardStats);
router.get("/complaints", OfficerController.getAssignedComplaints);
router.patch(
  "/complaints/:id/resolve",
  upload.single("image"),
  OfficerController.resolveComplaint,
);

export default router;
