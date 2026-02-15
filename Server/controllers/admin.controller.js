import {
  createUserByAdmin,
  getAllUsersService,
  manageUserService,
  getUserPerformanceService,
  getAllComplaintsService,
  getComplaintDetailsService,
  updateComplaintService,
  assignComplaintService,
  assignToOfficerDirectlyService,
  reassignComplaintService,
  escalateComplaintService,
  overrideComplaintService,
  getDashboardStatsService,
  getSLAComplianceReportService,
  getAuditTrailService,
  getSystemHealthService,
} from "../services/admin.service.js";
import User from "../models/User.model.js";
const calculatePerformanceScore = (performance) => {
  if (!performance) return 0;
  const { resolutionRate = 0, avgResolutionHours = 0 } = performance
  const resolutionScore = Math.min(resolutionRate, 100); 
  const timeScore = Math.max(0, 100 - avgResolutionHours * 5); 
  return Math.round(resolutionScore * 0.7 + timeScore * 0.3);
};
export const createUser = async (req, res, next) => {
  try {
    const result = await createUserByAdmin(req.body);
    res.status(201).json({
      success: true,
      data: result.user,
      token: result.token,
    });
  } catch (error) {
    next(error);
  }
};
export const getAllUsers = async (req, res, next) => {
  try {
    const users = await getAllUsersService(req.query);
    res.status(200).json({
      success: true,
      data: users,
      count: users.length,
    });
  } catch (error) {
    next(error);
  }
};
export const manageUser = async (req, res, next) => {
  try {
    const user = await manageUserService(
      req.params.userId,
      req.body.action,
      req.user._id,
      req.body.reason || "",
    );
    res.status(200).json({
      success: true,
      data: user,
      message: `User ${req.body.action.toLowerCase()}d successfully`,
    });
  } catch (error) {
    next(error);
  }
};
export const getUserPerformance = async (req, res, next) => {
  try {
    console.log("DEBUG: Getting performance for user:", req.params.userId);
    const performance = await getUserPerformanceService(req.params.userId);
    console.log("DEBUG: Service returned:", performance);
    const transformedData = {
      totalComplaints: performance.user.performance?.totalAssigned || 0,
      resolvedComplaints: performance.user.performance?.resolved || 0,
      resolutionRate: parseFloat(
        performance.user.performance?.resolutionRate || 0,
      ),
      avgResolutionTime: parseFloat(
        performance.user.performance?.avgResolutionHours || 0,
      ),
      activeComplaints: performance.user.performance?.currentlyAssigned || 0,
      performanceScore: calculatePerformanceScore(performance.user.performance),
    };
    console.log("DEBUG: Sending to frontend:", transformedData);
    res.status(200).json({
      success: true,
      data: transformedData,
    });
  } catch (error) {
    console.error("ERROR in getUserPerformance:", error.message);
    if (error.message.includes("User not found")) {
      return res.status(404).json({
        success: false,
        error: "User not found",
      });
    }
    res.status(200).json({
      success: true,
      data: {
        totalComplaints: 0,
        resolvedComplaints: 0,
        resolutionRate: 0,
        avgResolutionTime: 0,
        activeComplaints: 0,
        performanceScore: 0,
      },
    });
  }
};
export const getUser = async (req, res, next) => {
  try {
    console.log("Getting user with ID:", req.params.userId);
    const user = await User.findById(req.params.userId).select("-password");
    if (!user) {
      return res.status(404).json({
        success: false,
        error: "User not found",
      });
    }
    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error("Error in getUser controller:", error);
    next(error);
  }
};
export const getAllComplaints = async (req, res, next) => {
  try {
    const complaints = await getAllComplaintsService(req.query);
    res.status(200).json({
      success: true,
      data: complaints,
      count: complaints.length,
      filters: req.query,
    });
  } catch (error) {
    next(error);
  }
};
export const getComplaintDetails = async (req, res, next) => {
  try {
    const details = await getComplaintDetailsService(req.params.id);
    res.status(200).json({
      success: true,
      data: details,
    });
  } catch (error) {
    next(error);
  }
};
export const updateComplaint = async (req, res, next) => {
  try {
    const complaint = await updateComplaintService(
      req.params.id,
      req.body,
      req.user._id,
    );
    res.status(200).json({
      success: true,
      data: complaint,
      message: "Complaint updated successfully",
    });
  } catch (error) {
    next(error);
  }
};
export const assignComplaint = async (req, res, next) => {
  try {
    const { supervisorId } = req.body;
    const complaint = await assignComplaintService(
      req.params.id,
      supervisorId,
      req.user._id,
    );
    res.status(200).json({
      success: true,
      data: complaint,
      message: "Complaint assigned to supervisor successfully",
    });
  } catch (error) {
    next(error);
  }
};
export const assignToOfficerDirectly = async (req, res, next) => {
  try {
    const { officerId } = req.body;
    const complaint = await assignToOfficerDirectlyService(
      req.params.id,
      officerId,
      req.user._id,
    );
    res.status(200).json({
      success: true,
      data: complaint,
      message: "Complaint directly assigned to officer successfully",
    });
  } catch (error) {
    next(error);
  }
};
export const reassignComplaint = async (req, res, next) => {
  try {
    const { assigneeId, assigneeRole, reason } = req.body;
    const complaint = await reassignComplaintService(
      req.params.id,
      assigneeId,
      assigneeRole,
      req.user._id,
      reason || "",
    );
    res.status(200).json({
      success: true,
      data: complaint,
      message: `Complaint reassigned to ${assigneeRole} successfully`,
    });
  } catch (error) {
    next(error);
  }
};
export const escalateComplaint = async (req, res, next) => {
  try {
    const { reason, level } = req.body;
    const complaint = await escalateComplaintService(
      req.params.id,
      req.user._id,
      reason || "",
      level || 1,
    );
    res.status(200).json({
      success: true,
      data: complaint,
      message: `Complaint escalated to level ${complaint.sla?.escalationLevel || 1}`,
    });
  } catch (error) {
    next(error);
  }
};
export const overrideComplaint = async (req, res, next) => {
  try {
    const { action, reason } = req.body;
    const complaint = await overrideComplaintService(
      req.params.id,
      action,
      req.user._id,
      reason || "",
    );
    res.status(200).json({
      success: true,
      data: complaint,
      message: `Complaint ${action.toLowerCase()}d by admin`,
    });
  } catch (error) {
    next(error);
  }
};
export const getDashboardStats = async (req, res, next) => {
  try {
    const stats = await getDashboardStatsService();
    res.status(200).json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error("Error in getDashboardStats controller:", error);
    res.status(200).json({
      success: true,
      data: {
        counts: { total: 0, created: 0, assigned: 0, inProgress: 0, resolved: 0, rejected: 0, overdue: 0, escalated: 0 },
        rates: { resolutionRate: 0, overdueRate: 0, escalationRate: 0 },
        distributions: { categories: [], priorities: [] },
        performance: { resolutionTime: { avgHours: 0, fastest: 0, slowest: 0 }, topOfficers: [] },
        users: [],
        recentActivities: [],
        generatedAt: new Date(),
        timeRange: "all_time",
      },
      message: "Dashboard loaded with minimal data",
    });
  }
};
export const getSLAComplianceReport = async (req, res, next) => {
  try {
    const report = await getSLAComplianceReportService(
      req.query.startDate,
      req.query.endDate,
    );
    res.status(200).json({
      success: true,
      data: report,
    });
  } catch (error) {
    next(error);
  }
};
export const getAuditTrail = async (req, res, next) => {
  try {
    const auditLogs = await getAuditTrailService(req.query);
    res.status(200).json({
      success: true,
      data: auditLogs,
      count: auditLogs.length,
    });
  } catch (error) {
    next(error);
  }
};
export const getSystemHealth = async (req, res, next) => {
  try {
    const health = await getSystemHealthService();
    res.status(200).json({
      success: true,
      data: health,
    });
  } catch (error) {
    next(error);
  }
};
export const assignComplaintToSupervisor = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { supervisorId } = req.body;
    const adminId = req.user._id;

    const complaint = await assignComplaintService(id, supervisorId, adminId);
    res.status(200).json({
      success: true,
      data: complaint,
      message: "Complaint assigned to supervisor successfully",
    });
  } catch (error) {
    next(error);
  }
};
