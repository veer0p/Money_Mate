import Message from "../models/messageModel";
import SuspiciousMessage from "../models/suspiciousMessagesModel";
import { Request, Response } from "express";

export const createSuspiciousMessage = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { message_id, reason } = req.body;

    if (!message_id || !reason) {
      res.status(400).json({
        status: "error",
        message: "message_id and reason are required",
      });
      return;
    }

    // Verify message exists and get user_id
    const message = await Message.findByPk(message_id);
    if (!message) {
      res.status(404).json({
        status: "error",
        message: "Message not found",
      });
      return;
    }

    const suspiciousMessage = await SuspiciousMessage.create({
      message_id,
      reason,
    });

    res.status(201).json({
      status: "success",
      message: "Suspicious message flagged successfully",
      data: suspiciousMessage,
    });
  } catch (error: any) {
    console.error("Error creating suspicious message:", error);
    res.status(500).json({
      status: "error",
      message: "Internal server error",
    });
  }
};

export const getSuspiciousMessages = async (
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

    const suspiciousMessages = await SuspiciousMessage.findAll({
      include: [
        {
          model: Message,
          as: "message",
          where: { user_id: userId },
          attributes: ["message_body", "user_id"],
        },
      ],
    });

    res.status(200).json({
      status: "success",
      message: "Suspicious messages retrieved successfully",
      data: suspiciousMessages,
    });
  } catch (error: any) {
    console.error("Error fetching suspicious messages:", error);
    res.status(500).json({
      status: "error",
      message: "Internal server error",
    });
  }
};
