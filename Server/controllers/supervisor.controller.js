import * as SupervisorService from "../services/supervisor.service.js";
import ApiError from "../utils/ApiError.js";
export const getSupervisorDashboardStats = async (req, res, next) => {
  try {
    const stats = await SupervisorService.getSupervisorDashboardStatsService(
      req.user._id,
    );
    res.status(200).json({
      success: true,
      data: stats,
      message: "Dashboard stats fetched successfully",
    });
  } catch (error) {
    next(error);
  }
};
export const getAssignedComplaints = async (req, res, next) => {
  try {
    const complaints = await SupervisorService.getAssignedComplaintsService(
      req.user._id,
    );
    res.status(200).json({
      success: true,
      data: complaints,
      message: "Complaints fetched successfully",
    });
  } catch (error) {
    next(error);
  }
};
export const getComplaintsPendingVerification = async (req, res, next) => {
  try {
    const complaints =
      await SupervisorService.getComplaintsPendingVerificationService(
        req.user._id,
      );
    res.status(200).json({
      success: true,
      data: complaints,
      message: "Pending verification complaints fetched successfully",
    });
  } catch (error) {
    next(error);
  }
};
export const getAvailableOfficers = async (req, res, next) => {
  try {
    const officers = await SupervisorService.getAvailableOfficersService();
    res.status(200).json({
      success: true,
      data: officers,
      message: "Officers fetched successfully",
    });
  } catch (error) {
    next(error);
  }
};
export const updateComplaint = async (req, res, next) => {
  try {
    const complaintId = req.params.id;
    const data = {
      status: req.body.status,
      remarks: req.body.remarks,
    };

    if (req.file) {
      data.image = `/uploads/${req.file.filename}`;
    }

    const complaint =
      await SupervisorService.updateComplaintBySupervisorService(
        complaintId,
        data,
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
export const assignToOfficer = async (req, res, next) => {
  try {
    const { officerId } = req.body;

    if (!officerId) {
      throw new ApiError(400, "Officer ID is required");
    }

    const complaint = await SupervisorService.assignToOfficerService(
      req.params.id,
      officerId,
      req.user._id,
    );

    res.status(200).json({
      success: true,
      data: complaint,
      message: "Complaint assigned successfully",
    });
  } catch (error) {
    next(error);
  }
};
export const verifyComplaint = async (req, res, next) => {
  try {
    const complaint = await SupervisorService.verifyComplaintService(
      req.params.id,
      req.user._id,
      { remarks: req.body.remarks },
    );

    res.status(200).json({
      success: true,
      data: complaint,
      message: "Complaint verified successfully",
    });
  } catch (error) {
    next(error);
  }
};
export const rejectComplaint = async (req, res, next) => {
  try {
    const complaint = await SupervisorService.rejectComplaintService(
      req.params.id,
      req.user._id,
      { remarks: req.body.remarks },
    );

    res.status(200).json({
      success: true,
      data: complaint,
      message: "Complaint rejected successfully",
    });
  } catch (error) {
    next(error);
  }
};
export const testController = (req, res) => {
  res.status(200).json({
    success: true,
    message: "Supervisor controller is working",
  });
};
