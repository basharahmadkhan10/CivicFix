import Complaint from "../models/Complaint.model.js";
import AuditLog from "../models/AuditLog.model.js";
import User from "../models/User.model.js";
import { ROLES, COMPLAINT_STATES } from "../utils/constant.js";
import ApiError from "../utils/ApiError.js";
import { validateStateTransition } from "../utils/stateMachine.js";
export const getAssignedComplaintsService = async (supervisorId) => {
  try {
    return await Complaint.find({ assignedTo: supervisorId })
      .populate("user", "name email")
      .populate("assignedToOfficer", "name email")
      .sort({ createdAt: -1 });
  } catch (error) {
    console.error("Error in getAssignedComplaintsService:", error);
    throw error;
  }
};
export const getSupervisorDashboardStatsService = async (supervisorId) => {
  try {
    const complaints = await Complaint.find({ assignedTo: supervisorId });
    const totalAssigned = complaints.length;
    const pendingReview = complaints.filter(
      (c) => c.status === "PENDING_VERIFICATION",
    ).length;
    const inProgress = complaints.filter(
      (c) => c.status === "IN_PROGRESS",
    ).length;
    const resolved = complaints.filter((c) => c.status === "RESOLVED").length;
    const assigned = complaints.filter((c) => c.status === "ASSIGNED").length;
    const created = complaints.filter((c) => c.status === "CREATED").length;
    const rejected = complaints.filter((c) => c.status === "REJECTED").length;

    return {
      totalAssigned,
      pendingReview,
      inProgress,
      resolved,
      assigned,
      created,
      rejected,
    };
  } catch (error) {
    console.error("Error in getSupervisorDashboardStatsService:", error);
    throw error;
  }
};
export const getAvailableOfficersService = async () => {
  try {
    const officers = await User.find({ role: "OFFICER" })
      .select("name email department")
      .sort({ name: 1 });
    return officers;
  } catch (error) {
    console.error("Error in getAvailableOfficersService:", error);
    throw new ApiError(500, "Failed to fetch officers");
  }
};
export const updateComplaintBySupervisorService = async (
  complaintId,
  data,
  supervisorId,
) => {
  try {
    const complaint = await Complaint.findOne({
      _id: complaintId,
      assignedTo: supervisorId,
    });

    if (!complaint) {
      throw new ApiError(404, "Complaint not found or not assigned to you");
    }

    const oldStatus = complaint.status;
    const updates = [];
    if (data.status && data.status !== complaint.status) {
      validateStateTransition(complaint.status, data.status, ROLES.SUPERVISOR);
      complaint.status = data.status;
      updates.push(`Status: ${oldStatus} → ${data.status}`);
    }
    if (data.remarks !== undefined) {
      complaint.remarks = data.remarks;
      updates.push("Remarks updated");
    }
    if (data.image) {
      complaint.images.supervisor = data.image;
      updates.push("Image updated");
    }
    if (data.status && data.status !== oldStatus) {
      if (!complaint.statusHistory) complaint.statusHistory = [];
      complaint.statusHistory.push({
        status: data.status,
        changedBy: supervisorId,
        role: ROLES.SUPERVISOR,
        at: new Date(),
        remarks: "Updated by supervisor",
      });
    }

    await complaint.save();
    await AuditLog.create({
      complaint: complaintId,
      actor: supervisorId,
      role: ROLES.SUPERVISOR,
      oldStatus,
      newStatus: complaint.status,
      action: "UPDATE",
      remarks: `Supervisor updated complaint. Changes: ${updates.join(", ")}`,
    });

    return complaint;
  } catch (error) {
    console.error("Error in updateComplaintBySupervisorService:", error);
    throw error;
  }
};

export const assignToOfficerService = async (
  complaintId,
  officerId,
  supervisorId,
) => {
  try {
    const complaint = await Complaint.findOne({
      _id: complaintId,
      assignedTo: supervisorId,
    });

    if (!complaint) {
      console.log("Complaint not found");
      throw new ApiError(404, "Complaint not found or not assigned to you");
    }
    const officer = await User.findOne({ _id: officerId, role: "OFFICER" });
    if (!officer) {
      console.log("Officer not found");
      throw new ApiError(404, "Officer not found");
    }

    const oldStatus = complaint.status;
    complaint.assignedToOfficer = officerId;
    complaint.status = "IN_PROGRESS";

    if (!complaint.sla) complaint.sla = {};
    complaint.sla.dueBy = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
    complaint.sla.escalationLevel = 0;

    if (!complaint.statusHistory) complaint.statusHistory = [];
    complaint.statusHistory.push({
      status: "IN_PROGRESS",
      changedBy: supervisorId,
      role: ROLES.SUPERVISOR,
      at: new Date(),
      remarks: `Assigned to officer: ${officer.name}`,
    });
    complaint.markModified('status');
    complaint.markModified('assignedToOfficer');
    complaint.markModified('statusHistory');
    try {
      const savedComplaint = await complaint.save();
      console.log("6. Complaint saved! Returned from save:", {
        id: savedComplaint._id,
        status: savedComplaint.status,
        assignedToOfficer: savedComplaint.assignedToOfficer
      });
    } catch (saveError) {
      console.error("❌ Save error:", saveError);
      throw saveError;
    }
    const verifyComplaint = await Complaint.findById(complaintId);
    console.log("7. Verified complaint AFTER save (fresh from DB):", {
      id: verifyComplaint._id,
      status: verifyComplaint.status,
      assignedToOfficer: verifyComplaint.assignedToOfficer
    });
    const auditLog = await AuditLog.create({
      complaint: complaintId,
      actor: supervisorId,
      role: ROLES.SUPERVISOR,
      oldStatus,
      newStatus: verifyComplaint.status,
      action: "ASSIGN",
      remarks: `Assigned to officer: ${officer.name}`,
    });
    return verifyComplaint;
  } catch (error) {
    console.error("Error in assignToOfficerService:", error);
    throw error;
  }
};
export const getComplaintsPendingVerificationService = async (supervisorId) => {
  try {
    console.log(
      "Fetching PENDING_VERIFICATION complaints for supervisor:",
      supervisorId,
    );
    const complaints = await Complaint.find({
      assignedTo: supervisorId,
      status: "PENDING_VERIFICATION",
    })
      .populate("user", "name email")
      .populate("assignedToOfficer", "name email")
      .populate("assignedTo", "name email")
      .sort({ updatedAt: -1 });
    return complaints;
  } catch (error) {
    console.error("Error in getComplaintsPendingVerificationService:", error);
    throw error;
  }
};
export const verifyComplaintService = async (
  complaintId,
  supervisorId,
  data,
) => {
  try {
    const complaint = await Complaint.findOne({
      _id: complaintId,
      assignedTo: supervisorId,
      status: "PENDING_VERIFICATION",
    });

    if (!complaint) {
      throw new ApiError(
        404,
        "Complaint not found or not pending verification",
      );
    }

    const oldStatus = complaint.status;
    complaint.status = "RESOLVED";
    if (data.remarks) {
      complaint.remarks = data.remarks;
    }
    if (!complaint.statusHistory) complaint.statusHistory = [];
    complaint.statusHistory.push({
      status: "RESOLVED",
      changedBy: supervisorId,
      role: ROLES.SUPERVISOR,
      at: new Date(),
      remarks: data.remarks || "Verified and marked as resolved by supervisor",
    });
    await complaint.save();
    await AuditLog.create({
      complaint: complaintId,
      actor: supervisorId,
      role: ROLES.SUPERVISOR,
      oldStatus,
      newStatus: "RESOLVED",
      action: "VERIFY",
      remarks: data.remarks || "Complaint verified and marked as resolved",
    });

    return complaint;
  } catch (error) {
    console.error("Error in verifyComplaintService:", error);
    throw error;
  }
};
export const rejectComplaintService = async (
  complaintId,
  supervisorId,
  data,
) => {
  try {
    const complaint = await Complaint.findOne({
      _id: complaintId,
      assignedTo: supervisorId,
      status: "PENDING_VERIFICATION",
    });

    if (!complaint) {
      throw new ApiError(
        404,
        "Complaint not found or not pending verification",
      );
    }

    const oldStatus = complaint.status;
    complaint.status = "IN_PROGRESS";
    if (data.remarks) {
      complaint.remarks = data.remarks;
    }
    if (!complaint.statusHistory) complaint.statusHistory = [];
    complaint.statusHistory.push({
      status: "IN_PROGRESS",
      changedBy: supervisorId,
      role: ROLES.SUPERVISOR,
      at: new Date(),
      remarks: data.remarks || "Rejected by supervisor, needs rework",
    });
    await complaint.save();
    await AuditLog.create({
      complaint: complaintId,
      actor: supervisorId,
      role: ROLES.SUPERVISOR,
      oldStatus,
      newStatus: "IN_PROGRESS",
      action: "REJECT",
      remarks: data.remarks || "Complaint rejected, sent back for rework",
    });
    return complaint;
  } catch (error) {
    console.error("Error in rejectComplaintService:", error);
    throw error;
  }
};
