import express from "express";
import * as AuthController from "../controllers/auth.controller.js";
import { authLimiter, otpLimiter } from "../middlewares/rateLimiter.middleware.js";
const router = express.Router();
router.post("/register", authLimiter, AuthController.register);
router.post("/login", authLimiter, AuthController.login);
router.post("/login/verify-otp", otpLimiter, AuthController.verifyLoginOtp);
router.post("/forgot-password", otpLimiter, AuthController.forgotPassword);
router.post("/reset-password", otpLimiter, AuthController.resetPassword);

export default router;
