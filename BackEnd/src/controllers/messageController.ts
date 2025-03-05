import { Request, Response } from "express";
import { Message } from "../models/messageModel";
import User from "../models/userModel";
import { v4 as uuidv4 } from "uuid";

// Store single or multiple messages API
export const storeMessage = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { user_id, messages, sender, message_body } = req.body;

    if (!user_id) {
      res.status(400).json({ message: "User ID is required" });
      return;
    }

    // Check if user exists
    const user = await User.findOne({ where: { id: user_id } });
    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    let messagesArray = [];

    // If only one message is sent (auto-forwarding case)
    if (sender && message_body) {
      messagesArray.push({ sender, message_body });
    }
    // If multiple messages are sent (sync case)
    else if (Array.isArray(messages) && messages.length > 0) {
      messagesArray = messages;
    } else {
      res.status(400).json({ message: "Invalid request format" });
      return;
    }

    const uniqueMessages = [];

    for (const msg of messagesArray) {
      const { sender, message_body } = msg;

      if (!sender || !message_body) continue; // Skip invalid messages

      // Check if message already exists
      const existingMessage = await Message.findOne({
        where: { user_id, sender, message_body },
      });

      if (!existingMessage) {
        uniqueMessages.push({
          id: uuidv4(),
          user_id,
          sender,
          message_body,
          status: "received",
        });
      }
    }

    if (uniqueMessages.length > 0) {
      await Message.bulkCreate(uniqueMessages);
    }

    res.status(201).json({
      message: `${uniqueMessages.length} new messages stored successfully`,
    });
  } catch (error: unknown) {
    const err = error as Error;
    console.error("Error storing messages:", err.message);
    res
      .status(500)
      .json({ message: "Internal server error", error: err.message });
  }
  console.log(res);
};
