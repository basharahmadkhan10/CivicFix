import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import User from "../models/User.model.js";
import { ROLES } from "../utils/constant.js";
import Complaint from "../models/Complaint.model.js";
import AuditLog from "../models/AuditLog.model.js";
import { validateStateTransition } from "../utils/stateMachine.js";
import ApiError from "../utils/ApiError.js";
const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET || "your-secret-key", {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });
};
export const createUserByAdmin = async (userData) => {
  try {
    const { name, email, password, role } = userData;
    if (!role || !Object.values(ROLES).includes(role)) {
      throw new ApiError(400, "Invalid role");
    }
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw new ApiError(400, "User already exists");
    }
    const user = await User.create({
      name,
      email,
      password,
      role,
      isActive: true,
      createdBy: "ADMIN",
    });
    const token = generateToken(user._id);
    return {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
      },
      token,
    };
  } catch (error) {
    console.error("Service Error - createUserByAdmin:", error);
    throw error;
  }
};
export const getAllUsersService = async (filters = {}) => {
  const { role, isActive, search } = filters;
  let query = {};
  if (role) query.role = role;
  if (isActive !== undefined) query.isActive = isActive;
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } },
    ];
  }
  return await User.find(query).select("-password").sort({ createdAt: -1 });
};
export const manageUserService = async (
  userId,
  action,
  adminId,
  reason = "",
) => {
  const user = await User.findById(userId);
  if (!user) throw new ApiError(404, "User not found");
  const oldStatus = user.isActive;
  switch (action.toUpperCase()) {
    case "DEACTIVATE":
      user.isActive = false;
      user.deactivatedAt = new Date();
      user.deactivatedBy = adminId;
      user.deactivationReason = reason;
      break;

    case "ACTIVATE":
      user.isActive = true;
      user.deactivatedAt = null;
      user.deactivatedBy = null;
      user.deactivationReason = "";
      break;

    case "RESET_PASSWORD":
      const tempPassword = Math.random().toString(36).slice(-8) + "A1!";
      user.password = tempPassword;
      user.passwordResetRequired = true;
      break;
    default:
      throw new ApiError(400, "Invalid action");
  }

  await user.save();
  await AuditLog.create({
    actor: adminId,
    role: "ADMIN",
    action: `USER_${action.toUpperCase()}`,
    oldStatus: oldStatus ? "ACTIVE" : "INACTIVE",
    newStatus: user.isActive ? "ACTIVE" : "INACTIVE",
    remarks: `Admin ${action.toLowerCase()}d user: ${user.email}. Reason: ${reason}`,
    targetUser: userId,
  });

  return user;
};
export const getUserPerformanceService = async (userId) => {
  const user = await User.findById(userId).select("-password");
  if (!user) throw new ApiError(404, "User not found");

  let performance = {};

  if (user.role === ROLES.OFFICER) {
    const complaints = await Complaint.find({ assignedToOfficer: userId });
    const resolved = complaints.filter((c) => c.status === "RESOLVED");
    let totalResolutionTime = 0;
    resolved.forEach((complaint) => {
      const resolutionTime = complaint.updatedAt - complaint.createdAt;
      totalResolutionTime += resolutionTime;
    });

    performance = {
      totalAssigned: complaints.length,
      currentlyAssigned: complaints.filter((c) => c.status === "IN_PROGRESS")
        .length,
      resolved: resolved.length,
      resolutionRate:
        complaints.length > 0
          ? ((resolved.length / complaints.length) * 100).toFixed(1)
          : 0,
      avgResolutionHours:
        resolved.length > 0
          ? (totalResolutionTime / resolved.length / (1000 * 60 * 60)).toFixed(
              1,
            )
          : 0,
      lastActive: user.updatedAt,
    };
  } else if (user.role === ROLES.SUPERVISOR) {
    const assignedComplaints = await Complaint.find({ assignedTo: userId });
    const officerAssignments = await Complaint.find({
      assignedTo: userId,
      assignedToOfficer: { $exists: true, $ne: null },
    });

    performance = {
      totalManaged: assignedComplaints.length,
      currentlyManaging: assignedComplaints.filter((c) =>
        ["ASSIGNED", "IN_PROGRESS"].includes(c.status),
      ).length,
      assignedToOfficers: officerAssignments.length,
      resolvedUnderSupervision: assignedComplaints.filter(
        (c) => c.status === "RESOLVED",
      ).length,
      escalationRate:
        assignedComplaints.length > 0
          ? (
              (assignedComplaints.filter((c) => c.sla?.escalationLevel > 0)
                .length /
                assignedComplaints.length) *
              100
            ).toFixed(1)
          : 0,
    };
  }

  return {
    user: {
      ...user.toObject(),
      performance,
    },
  };
};

export const getAllComplaintsService = async (filters = {}) => {
  const { status, category, priority, startDate, endDate, escalated, search } =
    filters;

  let query = {};

  if (status) query.status = status;
  if (category) query.category = category;
  if (priority) query.priority = priority;
  if (escalated !== undefined) {
    query["sla.escalationLevel"] = escalated ? { $gt: 0 } : 0;
  }

  if (startDate || endDate) {
    query.createdAt = {};
    if (startDate) query.createdAt.$gte = new Date(startDate);
    if (endDate) query.createdAt.$lte = new Date(endDate);
  }

  if (search) {
    query.$or = [
      { title: { $regex: search, $options: "i" } },
      { description: { $regex: search, $options: "i" } },
      { area: { $regex: search, $options: "i" } },
    ];
  }

  const complaints = await Complaint.find(query)
    .populate("user", "name email")
    .populate("assignedTo", "name email role")
    .populate("assignedToOfficer", "name email role")
    .sort({ createdAt: -1 })
    .lean(); 

  const complaintsWithSLA = complaints.map((complaint) => {
    const isOverdue =
      complaint.sla?.dueBy &&
      new Date(complaint.sla.dueBy) < new Date() &&
      ["ASSIGNED", "IN_PROGRESS"].includes(complaint.status);

    return {
      ...complaint,
      slaStatus: isOverdue
        ? "OVERDUE"
        : complaint.sla?.escalationLevel > 0
          ? "ESCALATED"
          : "ON_TRACK",
    };
  });

  return complaintsWithSLA;
};

export const getComplaintDetailsService = async (complaintId) => {
  const complaint = await Complaint.findById(complaintId)
    .populate("user", "name email phone")
    .populate("assignedTo", "name email role")
    .populate("assignedToOfficer", "name email role");

  if (!complaint) throw new ApiError(404, "Complaint not found");

  const auditTrail = await AuditLog.find({ complaint: complaintId })
    .populate("actor", "name role")
    .sort({ createdAt: -1 });

  const statusHistory = complaint.statusHistory || [];

  const isOverdue =
    complaint.sla?.dueBy &&
    new Date(complaint.sla.dueBy) < new Date() &&
    ["ASSIGNED", "IN_PROGRESS"].includes(complaint.status);

  const slaStatus = isOverdue
    ? "OVERDUE"
    : complaint.sla?.escalationLevel > 0
      ? "ESCALATED"
      : "ON_TRACK";

  return {
    complaint,
    auditTrail,
    statusHistory,
    slaStatus,
    isOverdue,
    daysOverdue: isOverdue
      ? Math.ceil(
          (new Date() - new Date(complaint.sla.dueBy)) / (1000 * 60 * 60 * 24),
        )
      : 0,
  };
};

export const updateComplaintService = async (complaintId, data, adminId) => {
  const complaint = await Complaint.findById(complaintId);
  if (!complaint) throw new ApiError(404, "Complaint not found");

  const oldStatus = complaint.status;
  const updates = [];

  if (data.status && data.status !== complaint.status) {
    validateStateTransition(complaint.status, data.status, "ADMIN");
    complaint.status = data.status;
    updates.push(`Status: ${oldStatus} → ${data.status}`);
  }

  if (data.remarks !== undefined) {
    complaint.remarks = data.remarks;
    updates.push("Remarks updated");
  }

  if (
    data.priority &&
    ["LOW", "MEDIUM", "HIGH", "CRITICAL"].includes(data.priority)
  ) {
    complaint.priority = data.priority;
    updates.push(`Priority set to ${data.priority}`);
  }

  if (data.category) {
    complaint.category = data.category;
    updates.push(`Category updated to ${data.category}`);
  }

  if (data.dueBy) {
    complaint.sla = complaint.sla || {};
    complaint.sla.dueBy = new Date(data.dueBy);
    updates.push(`SLA due date updated to ${data.dueBy}`);
  }

  await complaint.save();
  if (data.status && data.status !== oldStatus) {
    if (!complaint.statusHistory) complaint.statusHistory = [];

    complaint.statusHistory.push({
      status: data.status,
      changedBy: adminId,
      role: "ADMIN",
      at: new Date(),
      remarks: "Updated by Admin",
    });

    await complaint.save();
  }

  await AuditLog.create({
    complaint: complaintId,
    actor: adminId,
    role: "ADMIN",
    oldStatus,
    newStatus: complaint.status,
    action: "UPDATE",
    remarks: `Admin updated complaint. Changes: ${updates.join(", ")}`,
  });

  return complaint;
};

export const assignComplaintService = async (
  complaintId,
  supervisorId,
  adminId,
) => {
  const complaint = await Complaint.findById(complaintId);
  if (!complaint) throw new ApiError(404, "Complaint not found");

  const supervisor = await User.findOne({
    _id: supervisorId,
    role: ROLES.SUPERVISOR,
    isActive: true,
  });

  if (!supervisor) throw new ApiError(400, "Invalid or inactive supervisor");

  const oldAssignee = complaint.assignedTo;
  const oldStatus = complaint.status;
  complaint.sla = complaint.sla || {};
  complaint.sla.assignedAt = new Date();
  const dueDate = new Date();
  const priorityDays = {
    CRITICAL: 1,
    HIGH: 2,
    MEDIUM: 7,
    LOW: 14,
  };

  dueDate.setDate(dueDate.getDate() + (priorityDays[complaint.priority] || 7));
  complaint.sla.dueBy = dueDate;

  complaint.assignedTo = supervisorId;
  complaint.status = "ASSIGNED";

  await complaint.save();

  if (!complaint.statusHistory) complaint.statusHistory = [];
  complaint.statusHistory.push({
    status: "ASSIGNED",
    changedBy: adminId,
    role: "ADMIN",
    at: new Date(),
    remarks: `Assigned to supervisor: ${supervisor.name}`,
  });

  await complaint.save();

  await AuditLog.create({
    complaint: complaintId,
    actor: adminId,
    role: "ADMIN",
    oldStatus,
    newStatus: "ASSIGNED",
    action: "ASSIGN_TO_SUPERVISOR",
    remarks: `Admin assigned to supervisor ${supervisor.name} (${supervisorId}). Due by: ${dueDate.toDateString()}`,
  });

  return complaint;
};
export const assignToOfficerDirectlyService = async (
  complaintId,
  officerId,
  adminId,
) => {
  const complaint = await Complaint.findById(complaintId);
  if (!complaint) throw new ApiError(404, "Complaint not found");

  const officer = await User.findOne({
    _id: officerId,
    role: ROLES.OFFICER,
    isActive: true,
  });
  if (!officer) throw new ApiError(400, "Invalid or inactive officer");
  const oldStatus = complaint.status;
  complaint.sla = complaint.sla || {};
  complaint.sla.assignedAt = new Date();
  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + 3); 
  complaint.sla.dueBy = dueDate;

  complaint.assignedToOfficer = officerId;
  complaint.status = "IN_PROGRESS";
  complaint.assignedTo = null; 

  await complaint.save();

  if (!complaint.statusHistory) complaint.statusHistory = [];
  complaint.statusHistory.push({
    status: "IN_PROGRESS",
    changedBy: adminId,
    role: "ADMIN",
    at: new Date(),
    remarks: `Directly assigned to officer: ${officer.name}`,
  });

  await complaint.save();

  await AuditLog.create({
    complaint: complaintId,
    actor: adminId,
    role: "ADMIN",
    oldStatus,
    newStatus: "IN_PROGRESS",
    action: "DIRECT_ASSIGN_TO_OFFICER",
    remarks: `Admin directly assigned to officer ${officer.name}. Due by: ${dueDate.toDateString()}`,
  });

  return complaint;
};
export const reassignComplaintService = async (
  complaintId,
  newAssigneeId,
  assigneeRole,
  adminId,
  reason = "",
) => {
  const complaint = await Complaint.findById(complaintId);
  if (!complaint) throw new ApiError(404, "Complaint not found");
  if (complaint.status === "RESOLVED") {
    throw new ApiError(400, "Cannot reassign a resolved complaint");
  }

  const assignee = await User.findOne({
    _id: newAssigneeId,
    role: assigneeRole,
    isActive: true,
  });
  if (!assignee) throw new ApiError(400, `Invalid or inactive ${assigneeRole}`);

  const oldAssignee =
    assigneeRole === ROLES.SUPERVISOR
      ? complaint.assignedTo
      : complaint.assignedToOfficer;
  const oldStatus = complaint.status;

  if (assigneeRole === ROLES.SUPERVISOR) {
    complaint.assignedTo = newAssigneeId;
    complaint.assignedToOfficer = null; 
    complaint.status = "ASSIGNED";
    complaint.sla = complaint.sla || {};
    complaint.sla.assignedAt = new Date();
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 7);
    complaint.sla.dueBy = dueDate;
    complaint.sla.escalationLevel = 0;
  } else if (assigneeRole === ROLES.OFFICER) {
    complaint.assignedToOfficer = newAssigneeId;
    complaint.status = "IN_PROGRESS";
    complaint.sla = complaint.sla || {};
    complaint.sla.assignedAt = new Date();
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 3);
    complaint.sla.dueBy = dueDate;
  }
  await complaint.save();

  if (!complaint.statusHistory) complaint.statusHistory = [];
  complaint.statusHistory.push({
    status: complaint.status,
    changedBy: adminId,
    role: "ADMIN",
    at: new Date(),
    remarks: `Reassigned to ${assigneeRole.toLowerCase()}: ${assignee.name}. Reason: ${reason || "Admin decision"}`,
  });
  await complaint.save();
  await AuditLog.create({
    complaint: complaintId,
    actor: adminId,
    role: "ADMIN",
    oldStatus,
    newStatus: complaint.status,
    action: "REASSIGN",
    remarks: `Admin reassigned from ${oldAssignee} to ${assigneeRole} ${assignee.name}. Reason: ${reason}`,
  });

  return complaint;
};
export const escalateComplaintService = async (
  complaintId,
  adminId,
  reason = "",
  level = 1,
) => {
  const complaint = await Complaint.findById(complaintId);
  if (!complaint) throw new ApiError(404, "Complaint not found");
  const oldEscalationLevel = complaint.sla?.escalationLevel || 0;
  complaint.sla = complaint.sla || {};
  complaint.sla.escalationLevel = oldEscalationLevel + level;
  complaint.sla.escalatedAt = new Date();
  complaint.priority = "HIGH"; // Auto-upgrade priority
  if (complaint.sla.escalationLevel >= 3) {
    complaint.priority = "CRITICAL";
  }
  await complaint.save();
  await AuditLog.create({
    complaint: complaintId,
    actor: adminId,
    role: "ADMIN",
    action: "ESCALATE",
    oldEscalationLevel,
    newEscalationLevel: complaint.sla.escalationLevel,
    remarks: `Admin escalated to level ${complaint.sla.escalationLevel}. Reason: ${reason || "Manual escalation"}`,
  });

  return complaint;
};
export const overrideComplaintService = async (
  complaintId,
  action,
  adminId,
  reason = "",
) => {
  const complaint = await Complaint.findById(complaintId);
  if (!complaint) throw new ApiError(404, "Complaint not found");
  const oldStatus = complaint.status;
  let newStatus = oldStatus;
  switch (action.toUpperCase()) {
    case "REOPEN":
      validateStateTransition(complaint.status, "ASSIGNED", "ADMIN");
      newStatus = "ASSIGNED";
      complaint.remarks += `\n[REOPENED BY ADMIN - ${new Date().toLocaleDateString()}]: ${reason}`;
      break;

    case "FORCE_RESOLVE":
      newStatus = "RESOLVED";
      complaint.remarks += `\n[FORCE RESOLVED BY ADMIN - ${new Date().toLocaleDateString()}]: ${reason}`;
      complaint.resolvedByAdmin = true;
      complaint.resolvedAt = new Date();
      break;

    case "REJECT":
      newStatus = "REJECTED";
      complaint.remarks += `\n[REJECTED BY ADMIN - ${new Date().toLocaleDateString()}]: ${reason}`;
      complaint.rejectedByAdmin = true;
      break;

    default:
      throw new ApiError(400, "Invalid override action");
  }

  complaint.status = newStatus;
  if (!complaint.statusHistory) complaint.statusHistory = [];
  complaint.statusHistory.push({
    status: newStatus,
    changedBy: adminId,
    role: "ADMIN",
    at: new Date(),
    remarks: `Admin ${action.toLowerCase()}: ${reason}`,
  });

  await complaint.save();
  await AuditLog.create({
    complaint: complaintId,
    actor: adminId,
    role: "ADMIN",
    oldStatus,
    newStatus,
    action: `ADMIN_${action.toUpperCase()}`,
    remarks: `Admin ${action.toLowerCase()} complaint. Reason: ${reason}`,
  });

  return complaint;
};

export const getDashboardStatsService = async () => {
  try {
    const total = await Complaint.countDocuments();
    const created = await Complaint.countDocuments({ status: "CREATED" });
    const assigned = await Complaint.countDocuments({ status: "ASSIGNED" });
    const inProgress = await Complaint.countDocuments({ status: "IN_PROGRESS" });
    const resolved = await Complaint.countDocuments({ status: "RESOLVED" });
    const rejected = await Complaint.countDocuments({ status: "REJECTED" });

    const overdue = await Complaint.countDocuments({
      "sla.dueBy": { $lt: new Date() },
      status: { $in: ["ASSIGNED", "IN_PROGRESS"] },
    });

    const escalated = await Complaint.countDocuments({
      "sla.escalationLevel": { $gt: 0 },
    });
    const categoryStats = await Complaint.aggregate([
      {
        $group: {
          _id: "$category",
          total: { $sum: 1 },
          resolved: {
            $sum: { $cond: [{ $eq: ["$status", "RESOLVED"] }, 1, 0] },
          },
        },
      },
      { $sort: { total: -1 } },
    ]);
    const priorityStats = await Complaint.aggregate([
      {
        $group: {
          _id: "$priority",
          total: { $sum: 1 },
        },
      },
    ]);

    const resolutionStats = await Complaint.aggregate([
      { $match: { status: "RESOLVED" } },
      {
        $group: {
          _id: null,
          avgHours: {
            $avg: {
              $divide: [
                { $subtract: ["$updatedAt", "$createdAt"] },
                1000 * 60 * 60,
              ],
            },
          },
          fastest: {
            $min: {
              $divide: [
                { $subtract: ["$updatedAt", "$createdAt"] },
                1000 * 60 * 60,
              ],
            },
          },
        },
      },
    ]);
    let recentActivities = [];
    try {
      recentActivities = await AuditLog.find()
        .sort({ createdAt: -1 })
        .limit(10)
        .populate({
          path: "actor",
          select: "name email",
        })
        .populate({
          path: "complaint",
          select: "title",
        })
        .lean();
      recentActivities = recentActivities.map(activity => ({
        ...activity,
        role: "ADMIN",
        action: activity.remarks || "Activity", 
      }));
    } catch (auditError) {
      console.warn("Could not fetch recent activities:", auditError);
      recentActivities = []; 
    }
    const topOfficers = await Complaint.aggregate([
      {
        $match: {
          assignedToOfficer: { $exists: true, $ne: null },
          status: "RESOLVED",
        },
      },
      {
        $group: {
          _id: "$assignedToOfficer",
          resolvedCount: { $sum: 1 },
          avgResolutionHours: {
            $avg: {
              $divide: [
                { $subtract: ["$updatedAt", "$createdAt"] },
                1000 * 60 * 60,
              ],
            },
          },
        },
      },
      { $sort: { resolvedCount: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "officer",
        },
      },
      { $unwind: { path: "$officer", preserveNullAndEmptyArrays: true } },
      {
        $project: {
          officerId: "$_id",
          officerName: "$officer.name",
          officerEmail: "$officer.email",
          resolvedCount: 1,
          avgResolutionHours: { $round: ["$avgResolutionHours", 1] },
        },
      },
    ]);
    const userStats = await User.aggregate([
      {
        $group: {
          _id: "$role",
          count: { $sum: 1 },
          active: {
            $sum: { $cond: [{ $eq: ["$isActive", true] }, 1, 0] },
          },
        },
      },
    ]);
    return {
      counts: {
        total,
        created,
        assigned,
        inProgress,
        resolved,
        rejected,
        overdue,
        escalated,
      },
      rates: {
        resolutionRate: total > 0 ? ((resolved / total) * 100).toFixed(1) : 0,
        overdueRate: total > 0 ? ((overdue / total) * 100).toFixed(1) : 0,
        escalationRate: total > 0 ? ((escalated / total) * 100).toFixed(1) : 0,
      },
      distributions: {
        categories: categoryStats,
        priorities: priorityStats,
      },
      performance: {
        resolutionTime: resolutionStats[0] || {
          avgHours: 0,
          fastest: 0,
          slowest: 0,
        },
        topOfficers,
      },
      users: userStats,
      recentActivities: recentActivities.slice(0, 5),
      generatedAt: new Date(),
      timeRange: "all_time",
    };
  } catch (error) {
    console.error("Error in getDashboardStatsService:", error);
    return {
      counts: {
        total: 0,
        created: 0,
        assigned: 0,
        inProgress: 0,
        resolved: 0,
        rejected: 0,
        overdue: 0,
        escalated: 0,
      },
      rates: {
        resolutionRate: 0,
        overdueRate: 0,
        escalationRate: 0,
      },
      distributions: {
        categories: [],
        priorities: [],
      },
      performance: {
        resolutionTime: { avgHours: 0, fastest: 0, slowest: 0 },
        topOfficers: [],
      },
      users: [],
      recentActivities: [],
      generatedAt: new Date(),
      timeRange: "all_time",
    };
  }
};
export const getSLAComplianceReportService = async (startDate, endDate) => {
  const dateFilter = {};
  if (startDate) dateFilter.$gte = new Date(startDate);
  if (endDate) dateFilter.$lte = new Date(endDate);

  const complaints = await Complaint.find(
    Object.keys(dateFilter).length > 0 ? { createdAt: dateFilter } : {},
  );
  let totalWithSLA = 0;
  let compliant = 0;
  let nonCompliant = 0;
  let totalResolutionTime = 0;
  let resolvedCount = 0;
  complaints.forEach((complaint) => {
    if (complaint.sla?.dueBy) {
      totalWithSLA++;

      if (complaint.status === "RESOLVED") {
        resolvedCount++;
        const resolutionTime = complaint.updatedAt - complaint.createdAt;
        totalResolutionTime += resolutionTime;

        if (complaint.updatedAt <= complaint.sla.dueBy) {
          compliant++;
        } else {
          nonCompliant++;
        }
      }
    }
  });

  const avgResolutionHours =
    resolvedCount > 0
      ? totalResolutionTime / resolvedCount / (1000 * 60 * 60)
      : 0;

  return {
    summary: {
      totalComplaints: complaints.length,
      totalWithSLA,
      compliant,
      nonCompliant,
      complianceRate:
        totalWithSLA > 0 ? ((compliant / totalWithSLA) * 100).toFixed(1) : 0,
      avgResolutionHours: avgResolutionHours.toFixed(1),
    },
    timePeriod: {
      startDate: startDate || "Beginning",
      endDate: endDate || "Now",
    },
    generatedAt: new Date(),
  };
};
export const getAuditTrailService = async (filters = {}) => {
  try {
    const {
      startDate,
      endDate,
      actorId,
      complaintId,
      action,
      role,
      limit = 50,
    } = filters;

    let query = {};
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    if (actorId) query.actor = actorId;
    if (complaintId) query.complaint = complaintId;
    if (action) query.action = action;
    if (role) query.role = role;
    const population = [];
    population.push({
      path: "actor",
      select: "name email role",
    });
    population.push({
      path: "complaint",
      select: "title status",
    });
    population.push({
      path: "targetUser",
      select: "name email",
      options: { strictPopulate: false } 
    });

    const auditLogs = await AuditLog.find(query)
      .populate(population)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .lean();
    return auditLogs;
  } catch (error) {
    console.error("Error in getAuditTrailService:", error);
    return [];
  }
};

export const getSystemHealthService = async () => {
  const dbStatus =
    mongoose.connection.readyState === 1 ? "HEALTHY" : "UNHEALTHY";
  const totalUsers = await User.countDocuments();
  const activeUsers = await User.countDocuments({ isActive: true });
  const totalComplaints = await Complaint.countDocuments();
  const pendingComplaints = await Complaint.countDocuments({
    status: { $in: ["CREATED", "ASSIGNED", "IN_PROGRESS"] },
  });
  const recentErrors = []; 
  const userCount = await User.countDocuments();
  const complaintCount = await Complaint.countDocuments();
  const auditLogCount = await AuditLog.countDocuments();

  const estimatedStorageMB =
    (userCount * 0.5 + 
      complaintCount * 2 + 
      auditLogCount * 1) / 1000; 

  return {
    status: "OPERATIONAL",
    timestamp: new Date(),
    components: {
      database: dbStatus,
      authentication: "OPERATIONAL",
      fileStorage: "OPERATIONAL",
      emailService: process.env.EMAIL_HOST ? "CONFIGURED" : "NOT_CONFIGURED",
    },
    metrics: {
      users: { total: totalUsers, active: activeUsers },
      complaints: { total: totalComplaints, pending: pendingComplaints },
      storage: { estimatedMB: estimatedStorageMB.toFixed(2) },
    },
    recentErrors,
    uptime: process.uptime(),
  };
};
