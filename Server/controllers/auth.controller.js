import * as AuthService from "../services/auth.service.js";
const handleError = (error, res) => {
  const statusCode = error.statusCode || 500;
  const message = error.message || "Internal server error";

  res.status(statusCode).json({
    success: false,
    message: message,
  });
};
export const register = async (req, res) => {
  try {
    console.log("Register request:", req.body);

    const result = await AuthService.registerUser(req.body);

    res.status(201).json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Register controller error:", error);
    handleError(error, res);
  }
};
export const login = async (req, res) => {
  try {
    console.log("Login request:", req.body.email);

    const result = await AuthService.loginUser(req.body);

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Login controller error:", error);
    handleError(error, res);
  }
};
export const verifyLoginOtp = async (req, res) => {
  try {
    console.log("Verify OTP request:", req.body.email);

    const result = await AuthService.verifyLoginOTP(req.body);

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Verify OTP controller error:", error);
    handleError(error, res);
  }
};
export const forgotPassword = async (req, res) => {
  try {
    console.log("Forgot password request:", req.body.email);

    const result = await AuthService.forgotPassword(req.body);

    res.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    console.error("Forgot password controller error:", error);
    handleError(error, res);
  }
};
export const resetPassword = async (req, res) => {
  try {
    console.log("Reset password request:", req.body.email);

    const result = await AuthService.resetPassword(req.body);

    res.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    console.error("Reset password controller error:", error);
    handleError(error, res);
  }
};
