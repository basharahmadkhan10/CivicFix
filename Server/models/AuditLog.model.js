import mongoose from "mongoose";
const auditLogSchema = new mongoose.Schema({
  complaint: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Complaint",
    required: false,
  },
  targetUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  actor: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  oldStatus: { type: String },
  newStatus: { type: String },
  remarks: { type: String },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model("AuditLog", auditLogSchema);
