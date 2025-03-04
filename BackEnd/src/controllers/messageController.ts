import { Request, Response } from "express";
import { Message } from "../models/messageModel";
import User from "../models/userModel";
import { v4 as uuidv4 } from "uuid";

// Store message API
export const storeMessage = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { user_id, sender, message_body } = req.body;

    // Validate request body
    if (!user_id || !sender || !message_body) {
      res.status(400).json({ message: "All fields are required" });
      return;
    }

    // Check if user exists
    const user = await User.findOne({ where: { id: user_id } });
    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    // Save message to DB
    const message = await Message.create({
      id: uuidv4(), // Generate unique ID
      user_id,
      sender,
      message_body,
      status: "received",
    });

    res.status(201).json({
      message: "Message stored successfully",
      data: message,
    });
  } catch (error: unknown) {
    const err = error as Error;
    console.error("Error storing message:", err.message);
    res
      .status(500)
      .json({ message: "Internal server error", error: err.message });
  }
};
