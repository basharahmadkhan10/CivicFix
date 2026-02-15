import mongoose from "mongoose";
const complaintSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      enum: ["Road", "Water", "Electricity", "Sanitation", "Other"],
      required: true,
    },
    area: {
      type: String,
      required: true,
    },
    images: {
      citizen: {
        type: [String],
        default: [],
      },
      supervisor: {
        type: String,
        default: "",
      },
      officer: {
        type: String,
        default: "",
      },
    },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    assignedToOfficer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      index: true,
    },
    status: {
      type: String,
      enum: [
        "CREATED",
        "ASSIGNED",
        "IN_PROGRESS",
        "PENDING_VERIFICATION",
        "RESOLVED",
        "WITHDRAWN",
        "REJECTED",
      ],
      default: "CREATED",
    },
    statusHistory: [
      {
        status: String,
        changedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        role: String,
        at: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    remarks: {
      type: String,
      default: "",
    },
    sla: {
      assignedAt: Date,
      dueBy: Date, // Auto-calculated: assignedAt + 7 days
      escalatedAt: Date,
      escalationLevel: { type: Number, default: 0 },
    },
    priority: {
      type: String,
      enum: ["LOW", "MEDIUM", "HIGH", "CRITICAL"],
      default: "MEDIUM",
    },
  },
  { timestamps: true },
);
const Complaint = mongoose.model("Complaint", complaintSchema);
export default Complaint;
