import { Request, Response } from "express";
import User from "../models/userModel";
import { v4 as uuidv4 } from "uuid";
import path from "path";
import fs from "fs";

// 📌 Get User Details by userId (UUID)
export const getUserDetails = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { userId } = req.params;

    if (!userId) {
      res.status(400).json({
        status: "error",
        message: "User ID is required",
      });
      return;
    }

    const user = await User.findByPk(userId, {
      attributes: [
        "id",
        "first_name",
        "last_name",
        "dob",
        "email",
        "phone_number",
        "is_active",
        "is_verified",
        "is_email_verified",
        "created_at",
        "last_login",
        "role",
        "is_2fa_enabled",
        "profile_image_url",
        "account_balance",
      ],
    });

    if (!user) {
      res.status(404).json({
        status: "error",
        message: "User not found",
      });
      return;
    }

    res.status(200).json({
      status: "success",
      message: "User details retrieved successfully",
      data: user,
    });
  } catch (error: any) {
    console.error("Error fetching user details:", error);
    res.status(500).json({
      status: "error",
      message: "Internal server error",
    });
  }
};

// 📌 Update User Details
export const updateUserDetails = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { userId } = req.params;

    if (!userId) {
      res.status(400).json({
        status: "error",
        message: "User ID is required",
      });
      return;
    }

    const updatedData = req.body;
    const [updatedRows] = await User.update(updatedData, {
      where: { id: userId },
    });

    if (updatedRows === 0) {
      res.status(404).json({
        status: "error",
        message: "User not found or no changes made",
      });
      return;
    }

    res.status(200).json({
      status: "success",
      message: "User updated successfully",
    });
  } catch (error: any) {
    console.error("Error updating user details:", error);
    res.status(500).json({
      status: "error",
      message: "Internal server error",
    });
  }
};

// 📌 Upload Profile Image
export const uploadProfileImage = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { userId } = req.params;

    if (!userId) {
      res.status(400).json({
        status: "error",
        message: "User ID is required",
      });
      return;
    }

    const user = await User.findByPk(userId);
    if (!user) {
      res.status(404).json({
        status: "error",
        message: "User not found",
      });
      return;
    }

    if (!req.file) {
      res.status(400).json({
        status: "error",
        message: "No file uploaded",
      });
      return;
    }

    // Save the file to the uploads directory
    const fileExtension = path.extname(req.file.originalname);
    const fileName = `${uuidv4()}${fileExtension}`;
    const uploadPath = path.join(__dirname, "../../uploads", fileName);

    fs.writeFileSync(uploadPath, req.file.buffer);

    // Update the user's profile_image_url
    const profileImageUrl = `/uploads/${fileName}`;
    await User.update(
      { profile_image_url: profileImageUrl },
      { where: { id: userId } }
    );

    res.status(200).json({
      status: "success",
      message: "Profile image uploaded successfully",
      data: { profile_image_url: profileImageUrl },
    });
  } catch (error: any) {
    console.error("Error uploading profile image:", error);
    res.status(500).json({
      status: "error",
      message: "Internal server error",
    });
  }
};
