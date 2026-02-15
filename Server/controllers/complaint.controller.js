import {
  createComplaintService,
  getUserComplaintsService,
  getComplaintByIdService,
  getComplaintDetailsService,
  updateComplaintService,
  withdrawComplaintService,
  getComplaintStatsService,
  searchComplaintsService,
  filterComplaintsByStatusService,
  getRecentComplaintsService,
  checkComplaintStatusService,
  addCommentService,
  getComplaintTimelineService,
} from "../services/complaint.service.js";
import Complaint from "../models/Complaint.model.js";
const processImages = (req) => {
  const images = [];
  if (req.files && req.files.length > 0) {
    req.files.forEach((file) => {
      if (file.path)
        images.push(file.path); 
      else if (file.location)
        images.push(file.location); 
      else if (file.url)
        images.push(file.url);
      else if (file.filename) images.push(`/uploads/${file.filename}`); 
    });
  }
  if (req.body.images && Array.isArray(req.body.images)) {
    images.push(
      ...req.body.images.filter((img) => img && typeof img === "string"),
    );
  }
  if (req.body.image) {
    if (Array.isArray(req.body.image)) {
      images.push(
        ...req.body.image.filter((img) => img && typeof img === "string"),
      );
    } else if (typeof req.body.image === "string" && req.body.image.trim()) {
      images.push(req.body.image);
    }
  }
  return images;
};

export const createComplaint = async (req, res) => {
  try {
    const imageUrls = processImages(req);

    const complaint = await createComplaintService(req.user._id, {
      ...req.body,
      image: imageUrls,
    });

    res.status(201).json({
      success: true,
      data: complaint,
      message: "Complaint created successfully",
    });
  } catch (error) {
    console.error("Create complaint error:", error);
    res.status(error.statusCode || 400).json({
      success: false,
      message: error.message,
    });
  }
};
export const getMyComplaints = async (req, res) => {
  try {
    const complaints = await getUserComplaintsService(req.user._id);
    res.json({
      success: true,
      data: complaints,
      count: complaints.length,
    });
  } catch (error) {
    console.error("Get my complaints error:", error);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getComplaintById = async (req, res) => {
  try {
    const complaint = await getComplaintByIdService(req.params.id);
    res.json({
      success: true,
      data: complaint,
    });
  } catch (error) {
    console.error("Get complaint by ID error:", error);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message,
    });
  }
};
export const getComplaintDetails = async (req, res) => {
  try {
    const details = await getComplaintDetailsService(req.params.id);
    res.json({
      success: true,
      data: details,
    });
  } catch (error) {
    console.error("Get complaint details error:", error);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message,
    });
  }
};
export const updateComplaint = async (req, res) => {
  try {
    const existingComplaint = await Complaint.findById(req.params.id);
    const imagesToKeep =
      typeof req.body.existingImages === "string"
        ? JSON.parse(req.body.existingImages)
        : req.body.existingImages || [];
    const allImages = [
      ...imagesToKeep,
      ...processImages(req) 
    ];
    const uniqueImages = [...new Set(allImages)];
    const complaint = await updateComplaintService(
      req.params.id,
      req.user._id,
      {
        ...req.body,
        image: uniqueImages,
      },
    );
    res.json({
      success: true,
      data: complaint,
      message: "Complaint updated successfully",
    });
  } catch (error) {
    console.error("Update complaint error:", error);
    res.status(error.statusCode || 400).json({
      success: false,
      message: error.message,
    });
  }
};
export const withdrawComplaint = async (req, res) => {
  try {
    const complaint = await withdrawComplaintService(
      req.params.id,
      req.user._id,
    );
    res.json({
      success: true,
      data: complaint,
      message: "Complaint withdrawn successfully",
    });
  } catch (error) {
    console.error("Withdraw complaint error:", error);
    res.status(error.statusCode || 400).json({
      success: false,
      message: error.message,
    });
  }
};
export const getComplaintStats = async (req, res) => {
  try {
    const stats = await getComplaintStatsService(req.user._id);
    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error("Get complaint stats error:", error);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message,
    });
  }
};
export const searchComplaints = async (req, res) => {
  try {
    const { q } = req.query;
    const complaints = await searchComplaintsService(req.user._id, q || "");
    res.json({
      success: true,
      data: complaints,
      count: complaints.length,
    });
  } catch (error) {
    console.error("Search complaints error:", error);
    res.status(error.statusCode || 400).json({
      success: false,
      message: error.message,
    });
  }
};
export const filterComplaintsByStatus = async (req, res) => {
  try {
    const { status } = req.query;
    const complaints = await filterComplaintsByStatusService(
      req.user._id,
      status,
    );
    res.json({
      success: true,
      data: complaints,
      count: complaints.length,
    });
  } catch (error) {
    console.error("Filter complaints error:", error);
    res.status(error.statusCode || 400).json({
      success: false,
      message: error.message,
    });
  }
};
export const getRecentComplaints = async (req, res) => {
  try {
    const { limit } = req.query;
    const complaints = await getRecentComplaintsService(
      req.user._id,
      limit || 10,
    );
    res.json({
      success: true,
      data: complaints,
      count: complaints.length,
    });
  } catch (error) {
    console.error("Get recent complaints error:", error);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message,
    });
  }
};
export const checkComplaintStatus = async (req, res) => {
  try {
    const status = await checkComplaintStatusService(
      req.params.id,
      req.user._id,
    );
    res.json({
      success: true,
      data: status,
    });
  } catch (error) {
    console.error("Check complaint status error:", error);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message,
    });
  }
};
export const addComment = async (req, res) => {
  try {
    const { comment } = req.body;
    const complaint = await addCommentService(
      req.params.id,
      req.user._id,
      comment,
    );
    res.json({
      success: true,
      data: complaint,
      message: "Comment added successfully",
    });
  } catch (error) {
    console.error("Add comment error:", error);
    res.status(error.statusCode || 400).json({
      success: false,
      message: error.message,
    });
  }
};
export const getComplaintTimeline = async (req, res) => {
  try {
    const timeline = await getComplaintTimelineService(
      req.params.id,
      req.user._id,
    );
    res.json({
      success: true,
      data: timeline,
    });
  } catch (error) {
    console.error("Get complaint timeline error:", error);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message,
    });
  }
};
