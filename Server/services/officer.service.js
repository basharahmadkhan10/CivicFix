import Complaint from "../models/Complaint.model.js";
import AuditLog from "../models/AuditLog.model.js";
import User from "../models/User.model.js";
import { ROLES } from "../utils/constant.js";
import ApiError from "../utils/ApiError.js";
export const getAssignedComplaintsService = async (officerId) => {
  try {
    console.log("=== GET ASSIGNED COMPLAINTS FOR OFFICER ===");
    console.log("Officer ID:", officerId);
    const complaints = await Complaint.find({ 
      assignedToOfficer: officerId 
    })
    .populate("user", "name email")
    .populate("assignedTo", "name email")
    .sort({ createdAt: -1 });
    return complaints;
  } catch (error) {
    console.error("Error in getAssignedComplaintsService:", error);
    throw error;
  }
};
export const getOfficerDashboardStatsService = async (officerId) => {
  try {
    const complaints = await Complaint.find({ assignedToOfficer: officerId });
    const total = complaints.length;
    const inProgress = complaints.filter(
      (c) => c.status === "IN_PROGRESS",
    ).length;
    const pendingVerification = complaints.filter(
      (c) => c.status === "PENDING_VERIFICATION",
    ).length;
    const resolved = complaints.filter((c) => c.status === "RESOLVED").length;
    const overdue = complaints.filter(
      (c) =>
        c.sla?.dueBy &&
        new Date(c.sla.dueBy) < new Date() &&
        ["IN_PROGRESS", "ASSIGNED"].includes(c.status),
    ).length;
    return {
      total,
      inProgress,
      pendingVerification,
      resolved,
      overdue,
      resolutionRate: total > 0 ? (resolved / total) * 100 : 0,
    };
  } catch (error) {
    console.error("Error in getOfficerDashboardStatsService:", error);
    throw error;
  }
};
export const resolveComplaintService = async (complaintId, officerId, data) => {
  try {
    
    const complaint = await Complaint.findOne({
      _id: complaintId,
      assignedToOfficer: officerId,
    });

    if (!complaint) {
      console.log("Complaint not found or not assigned to officer");
      throw new ApiError(404, "Complaint not assigned to you");
    }
    const allowedStatuses = ["IN_PROGRESS", "PENDING_VERIFICATION"];
    if (!allowedStatuses.includes(complaint.status)) {
      throw new ApiError(
        400,
        `Complaint cannot be resolved. Current status: ${complaint.status}. Allowed statuses: ${allowedStatuses.join(", ")}`,
      );
    }
    if (!data.image || data.image.length === 0) {
      throw new ApiError(400, "Resolution image is required");
    }

    const oldStatus = complaint.status;
    const isResubmission = oldStatus === "PENDING_VERIFICATION";
    if (!complaint.assignedTo) {
      const supervisor = await User.findOne({ role: "SUPERVISOR" });
      if (!supervisor) {
        throw new ApiError(404, "No supervisor available for verification");
      }
      complaint.assignedTo = supervisor._id;
    }
    complaint.status = "PENDING_VERIFICATION";
    if (!complaint.images) complaint.images = {};
    complaint.images.officer = data.image[0];

    if (data.remarks) {
      const timestamp = new Date().toLocaleString();
      if (isResubmission) {
        complaint.remarks = complaint.remarks
          ? `${complaint.remarks}\n[Re-submission at ${timestamp}]: ${data.remarks}`
          : `Re-submitted at ${timestamp}: ${data.remarks}`;
      } else {
        complaint.remarks = data.remarks;
      }
    }
    if (!complaint.statusHistory) complaint.statusHistory = [];
    complaint.statusHistory.push({
      status: "PENDING_VERIFICATION",
      changedBy: officerId,
      role: ROLES.OFFICER,
      at: new Date(),
      remarks: isResubmission
        ? "Re-submitted for verification"
        : "Submitted for verification",
    });

    await complaint.save();
    await AuditLog.create({
      complaint: complaintId,
      actor: officerId,
      role: ROLES.OFFICER,
      oldStatus,
      newStatus: "PENDING_VERIFICATION",
      action: "SUBMIT",
      remarks: isResubmission
        ? "Re-submitted resolution after rejection"
        : "Submitted resolution for verification",
    });

    return complaint;
  } catch (error) {
    console.error("Error in resolveComplaintService:", error);
    throw error;
  }
};