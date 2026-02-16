import jwt from "jsonwebtoken";
import User from "../models/User.model.js";
import { ROLES, OTP_PURPOSE } from "../utils/constant.js";
import { sendEmail } from "../utils/email.js"; 
const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET || "your-secret-key", {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });
};
export const registerUser = async (userData) => {
  try {
    const { name, email, password } = userData;
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw { statusCode: 400, message: "User already exists" };
    }
    const user = await User.create({
      name,
      email,
      password,
      role: ROLES.CITIZEN,
    });
    const token = generateToken(user._id);
    return {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      token,
    };
  } catch (error) {
    console.error("Service Error - registerUser:", error);
    throw error;
  }
};
export const loginUser = async (credentials) => {
  try {
    const { email, password } = credentials;
    const user = await User.findOne({ email }).select("+password");
    if (!user) {
      throw { statusCode: 401, message: "Invalid email or password" };
    }
    if (user.lockUntil && user.lockUntil > Date.now()) {
      throw { statusCode: 403, message: "Account temporarily locked" };
    }
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      user.loginAttempts += 1;
      if (user.loginAttempts >= 5) {
        user.lockUntil = Date.now() + 15 * 60 * 1000; // 15 minutes
      }
      await user.save();
      throw { statusCode: 401, message: "Invalid email or password" };
    }
    user.loginAttempts = 0;
    user.lockUntil = undefined;
    await user.save();
    if ([ROLES.SUPERVISOR, ROLES.ADMIN].includes(user.role)) {
      
      const otp = user.generateOTP(OTP_PURPOSE.LOGIN);
      await user.save();
      // 🔴 ADD THIS - logs OTP to Render console
  console.log("=================================");
  console.log(`🔐 OTP for ${user.email}: ${otp}`);
  console.log(`🔐 Expires: ${new Date(user.otp.expiresAt).toLocaleString()}`);
  console.log("=================================");
      await sendEmail({
        to: user.email,
        subject: "Login OTP",
        text: `Your login OTP is: ${otp}. It expires in 5 minutes.`,
      });

      return {
        message: "OTP sent for verification",
        otpRequired: true, 
      };
    }
    const token = generateToken(user._id);
    return {
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    };

  } catch (error) {
    console.error("Service Error - loginUser:", error);
    throw error;
  }
};
export const verifyLoginOTP = async (otpData) => {
  try {
    const { email, otp } = otpData;

    const user = await User.findOne({ email });
    if (!user || !user.verifyOTP(otp, OTP_PURPOSE.LOGIN)) {
      throw { statusCode: 401, message: "Invalid or expired OTP" };
    }

    user.clearOTP();
    await user.save();
    const token = generateToken(user._id);

    return {
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    };

  } catch (error) {
    console.error("Service Error - verifyLoginOTP:", error);
    throw error;
  }
};
export const forgotPassword = async (emailData) => {
  try {
    const { email } = emailData;

    const user = await User.findOne({ email });
    if (!user) {
      throw { statusCode: 404, message: "User not found" };
    }
    const otp = user.generateOTP(OTP_PURPOSE.RESET_PASSWORD);
    await user.save();
    await sendEmail({
      to: user.email,
      subject: "Password Reset OTP",
      text: `Your password reset OTP is: ${otp}. It expires in 5 minutes.`,
    });

    return {
      message: "OTP sent for password reset"
    };
  } catch (error) {
    console.error("Service Error - forgotPassword:", error);
    throw error;
  }
};
export const resetPassword = async (resetData) => {
  try {
    const { email, otp, newPassword } = resetData;

    const user = await User.findOne({ email });
    if (!user || !user.verifyOTP(otp, OTP_PURPOSE.RESET_PASSWORD)) {
      throw { statusCode: 400, message: "Invalid or expired OTP" };
    }
    user.password = newPassword;
    user.clearOTP();
    await user.save();

    return { message: "Password reset successful" };
  } catch (error) {
    console.error("Service Error - resetPassword:", error);
    throw error;
  }
};

