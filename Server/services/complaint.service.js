import Complaint from "../models/Complaint.model.js";
import ApiError from "../utils/ApiError.js";
import { COMPLAINT_STATES } from "../utils/constant.js";
export const createComplaintService = async (userId, data) => {
  const { title, description, category, area, image } = data;
  if (!title || !description || !category || !area) {
    throw new ApiError(400, "All fields are required");
  }
  let imagesArray = [];
  if (image) {
    if (Array.isArray(image)) {
      imagesArray = image.filter((img) => img && img.trim() !== "");
    } else if (typeof image === "string" && image.trim() !== "") {
      imagesArray = [image];
    }
  }
  const complaint = await Complaint.create({
    user: userId,
    title,
    description,
    category,
    area,
    images: {
      citizen: imagesArray,
    },
    status: COMPLAINT_STATES.CREATED,
    priority: "MEDIUM",
  });

  return complaint;
};
export const getUserComplaintsService = async (userId) => {
  return await Complaint.find({ user: userId })
    .populate("assignedTo", "name email role")
    .populate("assignedToOfficer", "name email role")
    .sort({ createdAt: -1 });
};
export const getComplaintByIdService = async (complaintId) => {
  const complaint = await Complaint.findById(complaintId)
    .populate("user", "name email phone")
    .populate("assignedTo", "name email role")
    .populate("assignedToOfficer", "name email role");

  if (!complaint) {
    throw new ApiError(404, "Complaint not found");
  }
  return complaint;
};
export const getComplaintDetailsService = async (complaintId) => {
  const complaint = await Complaint.findById(complaintId)
    .populate("user", "name email phone")
    .populate("assignedTo", "name email role")
    .populate("assignedToOfficer", "name email role");

  if (!complaint) {
    throw new ApiError(404, "Complaint not found");
  }
  const isOverdue =
    complaint.sla?.dueBy &&
    new Date(complaint.sla.dueBy) < new Date() &&
    [COMPLAINT_STATES.ASSIGNED, COMPLAINT_STATES.IN_PROGRESS].includes(
      complaint.status,
    );

  const slaStatus = isOverdue
    ? "OVERDUE"
    : complaint.sla?.escalationLevel > 0
      ? "ESCALATED"
      : "ON_TRACK";

  return {
    ...complaint.toObject(),
    slaStatus,
    isOverdue,
    daysOverdue: isOverdue
      ? Math.ceil(
          (new Date() - new Date(complaint.sla.dueBy)) / (1000 * 60 * 60 * 24),
        )
      : 0,
  };
};
export const updateComplaintService = async (complaintId, userId, data) => {
  const complaint = await Complaint.findOne({
    _id: complaintId,
    user: userId,
    status: COMPLAINT_STATES.CREATED,
  });

  if (!complaint) {
    throw new ApiError(404, "Complaint not found or cannot be updated");
  }
  if (
    complaint.status === "RESOLVED" &&
    data.status &&
    data.status !== "RESOLVED"
  ) {
    throw new ApiError(
      400,
      "Cannot change status of a resolved complaint. Use override to reopen.",
    );
  }
  const allowedUpdates = ["title", "description", "category", "area"];
  allowedUpdates.forEach((field) => {
    if (data[field] !== undefined) {
      complaint[field] = data[field];
    }
  });
  if (data.image && Array.isArray(data.image)) {
    complaint.images.citizen = data.image;
  }

  await complaint.save();
  return complaint;
};
export const withdrawComplaintService = async (complaintId, userId) => {
  const complaint = await Complaint.findOne({
    _id: complaintId,
    user: userId,
    status: { $in: [COMPLAINT_STATES.CREATED, COMPLAINT_STATES.ASSIGNED] },
  });
  if (!complaint) {
    throw new ApiError(
      400,
      "Complaint cannot be withdrawn (already in progress or resolved)",
    );
  }

  complaint.status = "WITHDRAWN";
  complaint.withdrawnAt = new Date();
  await complaint.save();
  return complaint;
};
export const getComplaintStatsService = async (userId) => {
  const stats = await Complaint.aggregate([
    { $match: { user: userId } },
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        created: {
          $sum: {
            $cond: [{ $eq: ["$status", COMPLAINT_STATES.CREATED] }, 1, 0],
          },
        },
        assigned: {
          $sum: {
            $cond: [{ $eq: ["$status", COMPLAINT_STATES.ASSIGNED] }, 1, 0],
          },
        },
        inProgress: {
          $sum: {
            $cond: [{ $eq: ["$status", COMPLAINT_STATES.IN_PROGRESS] }, 1, 0],
          },
        },
        resolved: {
          $sum: {
            $cond: [{ $eq: ["$status", COMPLAINT_STATES.RESOLVED] }, 1, 0],
          },
        },
        rejected: {
          $sum: {
            $cond: [{ $eq: ["$status", COMPLAINT_STATES.REJECTED] }, 1, 0],
          },
        },
        withdrawn: {
          $sum: { $cond: [{ $eq: ["$status", "WITHDRAWN"] }, 1, 0] },
        },
      },
    },
  ]);

  return (
    stats[0] || {
      total: 0,
      created: 0,
      assigned: 0,
      inProgress: 0,
      resolved: 0,
      rejected: 0,
      withdrawn: 0,
    }
  );
};

export const searchComplaintsService = async (userId, searchQuery) => {
  const complaints = await Complaint.find({
    user: userId,
    $or: [
      { title: { $regex: searchQuery, $options: "i" } },
      { description: { $regex: searchQuery, $options: "i" } },
      { category: { $regex: searchQuery, $options: "i" } },
      { area: { $regex: searchQuery, $options: "i" } },
    ],
  })
    .populate("assignedTo", "name email role")
    .populate("assignedToOfficer", "name email role")
    .sort({ createdAt: -1 });

  return complaints;
};
export const filterComplaintsByStatusService = async (userId, status) => {
  const validStatuses = [...Object.values(COMPLAINT_STATES), "WITHDRAWN"];
  if (!validStatuses.includes(status)) {
    throw new ApiError(400, "Invalid status filter");
  }

  const complaints = await Complaint.find({
    user: userId,
    status: status,
  })
    .populate("assignedTo", "name email role")
    .populate("assignedToOfficer", "name email role")
    .sort({ createdAt: -1 });

  return complaints;
};

export const getRecentComplaintsService = async (userId, limit = 10) => {
  const complaints = await Complaint.find({ user: userId })
    .populate("assignedTo", "name email role")
    .populate("assignedToOfficer", "name email role")
    .sort({ createdAt: -1 })
    .limit(parseInt(limit));

  return complaints;
};

export const checkComplaintStatusService = async (complaintId, userId) => {
  const complaint = await Complaint.findOne({
    _id: complaintId,
    user: userId,
  }).select("status sla remarks updatedAt priority category area title images");

  if (!complaint) {
    throw new ApiError(404, "Complaint not found");
  }
  const isOverdue =
    complaint.sla?.dueBy &&
    new Date(complaint.sla.dueBy) < new Date() &&
    [COMPLAINT_STATES.ASSIGNED, COMPLAINT_STATES.IN_PROGRESS].includes(
      complaint.status,
    );

  return {
    status: complaint.status,
    lastUpdated: complaint.updatedAt,
    remarks: complaint.remarks,
    sla: complaint.sla,
    isOverdue,
    daysOverdue: isOverdue
      ? Math.ceil(
          (new Date() - new Date(complaint.sla.dueBy)) / (1000 * 60 * 60 * 24),
        )
      : 0,
    priority: complaint.priority,
    category: complaint.category,
    area: complaint.area,
    title: complaint.title,
    images: complaint.images,
  };
};
export const addCommentService = async (complaintId, userId, comment) => {
  if (!comment || comment.trim() === "") {
    throw new ApiError(400, "Comment cannot be empty");
  }

  const complaint = await Complaint.findOne({
    _id: complaintId,
    user: userId,
  });

  if (!complaint) {
    throw new ApiError(404, "Complaint not found");
  }
  if (!complaint.comments) {
    complaint.comments = [];
  }

  complaint.comments.push({
    user: userId,
    comment: comment.trim(),
    createdAt: new Date(),
  });

  await complaint.save();
  return complaint;
};
export const getComplaintTimelineService = async (complaintId, userId) => {
  const complaint = await Complaint.findOne({
    _id: complaintId,
    user: userId,
  }).select("statusHistory createdAt updatedAt sla comments");

  if (!complaint) {
    throw new ApiError(404, "Complaint not found");
  }

  const timeline = [];
  timeline.push({
    event: "CREATED",
    date: complaint.createdAt,
    description: "Complaint created",
    type: "system",
  });

  if (complaint.statusHistory && complaint.statusHistory.length > 0) {
    complaint.statusHistory.forEach((history) => {
      timeline.push({
        event: history.status,
        date: history.at,
        description: `Status changed to ${history.status} by ${history.role}`,
        changedBy: history.changedBy,
        type: "status_change",
      });
    });
  }

  if (complaint.sla) {
    if (complaint.sla.assignedAt) {
      timeline.push({
        event: "ASSIGNED",
        date: complaint.sla.assignedAt,
        description: "Complaint assigned for resolution",
        type: "sla",
      });
    }

    if (complaint.sla.dueBy) {
      timeline.push({
        event: "DUE_DATE_SET",
        date: complaint.sla.dueBy,
        description: `Due date set: ${complaint.sla.dueBy.toDateString()}`,
        type: "sla",
      });
    }

    if (complaint.sla.escalatedAt) {
      timeline.push({
        event: "ESCALATED",
        date: complaint.sla.escalatedAt,
        description: `Complaint escalated to level ${complaint.sla.escalationLevel}`,
        type: "escalation",
      });
    }
  }
  if (complaint.comments && complaint.comments.length > 0) {
    complaint.comments.forEach((comment) => {
      timeline.push({
        event: "COMMENT_ADDED",
        date: comment.createdAt,
        description: `Comment added: ${comment.comment.substring(0, 50)}${comment.comment.length > 50 ? "..." : ""}`,
        type: "comment",
      });
    });
  }
  timeline.push({
    event: "UPDATED",
    date: complaint.updatedAt,
    description: "Last updated",
    type: "system",
  });
  timeline.sort((a, b) => b.date - a.date);

  return timeline;
};
export const getComplaintsByCategoryService = async (userId, category) => {
  const complaints = await Complaint.find({
    user: userId,
    category: category,
  })
    .populate("assignedTo", "name email role")
    .populate("assignedToOfficer", "name email role")
    .sort({ createdAt: -1 });

  return complaints;
};
export const getComplaintsByPriorityService = async (userId, priority) => {
  const validPriorities = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];
  if (!validPriorities.includes(priority)) {
    throw new ApiError(400, "Invalid priority");
  }
  const complaints = await Complaint.find({
    user: userId,
    priority: priority,
  })
    .populate("assignedTo", "name email role")
    .populate("assignedToOfficer", "name email role")
    .sort({ createdAt: -1 });

  return complaints;
};
export const getOverdueComplaintsService = async (userId) => {
  const complaints = await Complaint.find({
    user: userId,
    "sla.dueBy": { $lt: new Date() },
    status: { $in: [COMPLAINT_STATES.ASSIGNED, COMPLAINT_STATES.IN_PROGRESS] },
  })
    .populate("assignedTo", "name email role")
    .populate("assignedToOfficer", "name email role")
    .sort({ "sla.dueBy": 1 });

  return complaints.map((complaint) => ({
    ...complaint.toObject(),
    daysOverdue: Math.ceil(
      (new Date() - new Date(complaint.sla.dueBy)) / (1000 * 60 * 60 * 24),
    ),
  }));
};
