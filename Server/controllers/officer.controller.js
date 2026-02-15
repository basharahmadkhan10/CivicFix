import * as OfficerService from "../services/officer.service.js";
import ApiError from "../utils/ApiError.js";
export const getOfficerDashboardStats = async (req, res, next) => {
  try {
    console.log("=== GET OFFICER DASHBOARD STATS ===");
    console.log("Officer ID:", req.user._id);

    const stats = await OfficerService.getOfficerDashboardStatsService(
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
    console.log("=== GET ASSIGNED COMPLAINTS ===");
    console.log("Officer ID:", req.user._id);

    const complaints = await OfficerService.getAssignedComplaintsService(
      req.user._id,
    );

    console.log(`Returning ${complaints.length} complaints to frontend`);

    res.status(200).json({
      success: true,
      data: complaints,
      message: "Complaints fetched successfully",
    });
  } catch (error) {
    next(error);
  }
};
export const resolveComplaint = async (req, res, next) => {
  try {
    console.log("=== OFFICER UPLOAD DEBUG ===");
    console.log("req.file:", req.file);
    console.log("req.file.path:", req.file?.path);
    console.log("req.file.filename:", req.file?.filename);
    console.log("req.file.destination:", req.file?.destination);
    if (!req.file) {
      throw new ApiError(400, "Resolution image is required");
    }
    const imageUrl = req.file.path; 

    console.log("Image URL being saved:", imageUrl);

    const data = {
      image: [imageUrl],
      remarks: req.body.remarks,
    };

    const complaint = await OfficerService.resolveComplaintService(
      req.params.id,
      req.user._id,
      data,
    );

    res.status(200).json({
      success: true,
      data: complaint,
      message: "Complaint submitted for verification successfully",
    });
  } catch (error) {
    console.error("Error in resolveComplaint:", error);
    next(error);
  }
};
