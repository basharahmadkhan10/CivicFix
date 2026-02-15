import express from "express";
import { protect } from "../middlewares/auth.middleware.js";
import { upload, handleUploadError } from "../middlewares/upload.middleware.js";
import * as ComplaintController from "../controllers/complaint.controller.js";
const router = express.Router();
router.use(protect);

router.post(
  "/",
  upload.array("image", 5),
  handleUploadError,
  ComplaintController.createComplaint,
);
router.get("/my", ComplaintController.getMyComplaints);
router.get("/search", ComplaintController.searchComplaints);
router.get("/filter", ComplaintController.filterComplaintsByStatus);
router.get("/recent", ComplaintController.getRecentComplaints);
router.get("/stats", ComplaintController.getComplaintStats);
router.get("/:id", ComplaintController.getComplaintById);
router.get("/:id/details", ComplaintController.getComplaintDetails);
router.get("/:id/status", ComplaintController.checkComplaintStatus);
router.get("/:id/timeline", ComplaintController.getComplaintTimeline);
router.patch(
  "/:id",
  upload.array("image", 5),
  handleUploadError,
  ComplaintController.updateComplaint,
);
router.patch("/:id/withdraw", ComplaintController.withdrawComplaint);
router.post("/:id/comments", ComplaintController.addComment);

export default router;
