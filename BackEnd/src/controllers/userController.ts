import { Request, Response } from "express";
import User from "../models/userModel";

// 📌 Get User by ID
export const getUserDetails = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = parseInt(req.params.id, 10);
    if (isNaN(userId)) {
      res.status(400).json({ message: "Invalid user ID" });
      return;
    }

    const user = await User.findByPk(userId); // ✅ Correct Sequelize method
    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    res.status(200).json(user);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// 📌 Update User Details
export const updateUserDetails = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = parseInt(req.params.id, 10);
    if (isNaN(userId)) {
      res.status(400).json({ message: "Invalid user ID" });
      return;
    }

    const updatedData = req.body;
    const [updatedRows] = await User.update(updatedData, {
      where: { id: userId },
    }); // ✅ Correct method

    if (updatedRows === 0) {
      res.status(404).json({ message: "User not found or no changes made" });
      return;
    }

    res.status(200).json({ message: "User updated successfully" });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// 📌 Get All Users
export const getAllUsers = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const users = await User.findAll(); // ✅ Correct Sequelize method
    res.status(200).json(users);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
