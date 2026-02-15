import express from "express";
import authRoutes from "./routes/auth.route.js";
import userRoutes from "./routes/user.route.js";
import globalErrorHandler from "./middlewares/error.middleware.js";
import complaintRoutes from "./routes/complaint.route.js";
import adminUserRoutes from "./routes/admin.route.js";
import supervisorRoutes from "./routes/supervisor.route.js";
import officerRoutes from "./routes/officer.route.js";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "Accept"],
    exposedHeaders: ["Authorization"],
  }),
);
app.use(express.json());
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/user", userRoutes);
app.use("/api/v1/complaints", complaintRoutes);
app.use("/api/v1/admin", adminUserRoutes);
app.use("/api/v1/supervisor", supervisorRoutes);
app.use("/api/v1/officer", officerRoutes);
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use(globalErrorHandler);
export default app;
