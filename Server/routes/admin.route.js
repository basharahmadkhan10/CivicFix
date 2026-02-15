import express from "express";
import { protect, authorize } from "../middlewares/auth.middleware.js";
import {
  createUser,
  getAllUsers,
  manageUser,
  getUserPerformance,
  getUser,
  getAllComplaints,
  getComplaintDetails,
  updateComplaint,
  assignComplaint,
  assignToOfficerDirectly,
  reassignComplaint,
  escalateComplaint,
  overrideComplaint,
  getDashboardStats,
  getSLAComplianceReport,
  getAuditTrail,
  getSystemHealth,
  assignComplaintToSupervisor,
} from "../controllers/admin.controller.js";

const router = express.Router();
router.use(protect, authorize("ADMIN"));
router.post("/users", createUser);
router.get("/users", getAllUsers);
router.get("/users/:userId", getUser);
router.patch("/users/:userId/manage", manageUser);
router.get("/users/:userId/performance", getUserPerformance);

// complaint routes
router.get("/complaints", getAllComplaints);
router.get("/complaints/:id", getComplaintDetails);
router.patch("/complaints/:id", updateComplaint);
router.patch("/complaints/:id/assign", assignComplaint); 
router.patch("/complaints/:id/assign-officer", assignToOfficerDirectly);
router.patch("/complaints/:id/reassign", reassignComplaint);
router.patch("/complaints/:id/escalate", escalateComplaint);
router.patch("/complaints/:id/override", overrideComplaint);

// dashboard routes
router.get("/dashboard", getDashboardStats);
router.get("/reports/sla-compliance", getSLAComplianceReport);
router.get("/audit-trail", getAuditTrail);
router.get("/system-health", getSystemHealth);

// default
router.patch("/complaints/:id/assign-supervisor", assignComplaintToSupervisor);

export default router;
