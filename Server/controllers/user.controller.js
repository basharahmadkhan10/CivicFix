import User from "../models/User.model.js";
import ApiError from "../utils/ApiError.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
export const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select("-password -otp");
    if (!user) {
      throw new ApiError(404, "User not found");
    }
    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};
export const updateMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      throw new ApiError(404, "User not found");
    }
    const { name, phone, address, dateOfBirth } = req.body;
    if (name) user.name = name;
    if (phone !== undefined) user.phone = phone;
    if (address !== undefined) user.address = address;
    if (dateOfBirth) user.dateOfBirth = new Date(dateOfBirth);
    if (req.file) {
      if (user.profileImage && !user.profileImage.startsWith("data:image")) {
        const oldImagePath = path.join(__dirname, "../../", user.profileImage);
        try {
          if (fs.existsSync(oldImagePath)) {
            fs.unlinkSync(oldImagePath);
          }
        } catch (err) {
          console.error("Error deleting old image:", err);
        }
      }
      user.profileImage = `/uploads/${req.file.filename}`;
    }
    await user.save();
    const updatedUser = await User.findById(user._id).select("-password -otp");

    res.status(200).json({
      success: true,
      data: updatedUser,
    });
  } catch (error) {
    console.error("updateMe error:", error);
    next(error);
  }
};
export const getUserById = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select("-password -otp");
    if (!user) {
      throw new ApiError(404, "User not found");
    }
    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};
