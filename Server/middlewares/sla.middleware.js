import Complaint from "../models/Complaint.model.js";
export const applySLA = async (req, res, next) => {
  try {
    if (req.body.status === "ASSIGNED" && req.user.role === "SUPERVISOR") {
      const dueBy = new Date();
      dueBy.setDate(dueBy.getDate() + 7);

      req.body.sla = {
        assignedAt: new Date(),
        dueBy: dueBy,
        escalationLevel: 0,
      };
    }

    next();
  } catch (error) {
    next(error);
  }
};
export const checkEscalation = async () => {
  const overdueComplaints = await Complaint.find({
    "sla.dueBy": { $lt: new Date() },
    status: { $in: ["ASSIGNED", "IN_PROGRESS"] },
    "sla.escalationLevel": { $lt: 3 },
  });
  for (const complaint of overdueComplaints) {
    complaint.sla.escalationLevel += 1;
    complaint.sla.escalatedAt = new Date();
    if (complaint.sla.escalationLevel === 1) {
      console.log(`Escalating complaint ${complaint._id} to level 1`);
    }

    await complaint.save();
  }
};
