import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { ROLES, OTP_PURPOSE } from "../utils/constant.js";
const otpSchema = new mongoose.Schema(
  {
    code: String,
    expiresAt: Date,
    purpose: {
      type: String,
      enum: Object.values(OTP_PURPOSE),
    },
  },
  { _id: false },
);
const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
      select: false,
    },
    role: {
      type: String,
      enum: Object.values(ROLES),
      default: ROLES.CITIZEN,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    profileImage: {
      type: String,
      default: null,
    },

    otp: otpSchema,
    loginAttempts: {
      type: Number,
      default: 0,
    },
    lockUntil: Date,
  },
  { timestamps: true },
);
userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  } catch (error) {
    console.error("Password hashing error:", error);
    throw error;
  }
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.generateOTP = function (purpose) {
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const hashedOtp = crypto.createHash("sha256").update(otp).digest("hex");
  this.otp = {
    code: hashedOtp,
    expiresAt: Date.now() + 5 * 60 * 1000,
    purpose,
  };

  return otp;
};
userSchema.methods.verifyOTP = function (enteredOtp, purpose) {
  if (!this.otp) return false;
  const hashedOtp = crypto
    .createHash("sha256")
    .update(enteredOtp)
    .digest("hex");

  return (
    this.otp.code === hashedOtp &&
    this.otp.purpose === purpose &&
    this.otp.expiresAt > Date.now()
  );
};
userSchema.methods.clearOTP = function () {
  this.otp = undefined;
};
export default mongoose.model("User", userSchema);
