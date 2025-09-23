import { Request, Response } from "express";
import { Message } from "../models/messageModel";
import User from "../models/userModel";
import { v4 as uuidv4 } from "uuid";
import { sequelize } from "../config/db";
import { Parser } from "json2csv";
import { PythonProcessor } from "../services/pythonProcessor";

export const exportMessagesToCSV = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { user_id } = req.query;

    if (!user_id) {
      res.status(400).json({ message: "User ID is required." });
      return;
    }

    // Fetch messages from the database
    const messages = await Message.findAll({ where: { user_id } });

    if (!messages.length) {
      res.status(404).json({ message: "No messages found for this user." });
      return;
    }

    // Convert to CSV
    const parser = new Parser({
      fields: ["id", "sender", "message_body", "status", "received_at"],
    });
    const csv = parser.parse(messages.map((msg) => msg.toJSON()));

    // Set headers for CSV download
    res.setHeader("Content-Type", "text/csv");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=messages_${user_id}.csv`
    );
    res.status(200).send(csv);
  } catch (error) {
    console.error("Error exporting messages:", error);
    res.status(500).json({ message: "Failed to export messages.", error });
  }
};

export const storeMessage = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { user_id, messages } = req.body;

  if (
    !user_id ||
    !messages ||
    !Array.isArray(messages) ||
    messages.length === 0
  ) {
    res.status(400).json({
      message:
        "Invalid request. User ID and a non-empty messages array are required.",
    });
    return;
  }

  try {
    const user = await User.findByPk(user_id);
    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }
  } catch (error) {
    res
      .status(500)
      .json({ message: "Database error while fetching user.", error });
    return;
  }

  // Set up SSE headers for real-time progress updates
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  // Format messages
  const formattedMessages = messages.map((message) => ({
    id: uuidv4(),
    user_id,
    sender: message.sender,
    message_body: message.message_body,
    status: message.status || "received",
    received_at: message.received_at || new Date(),
  }));

  let transaction;
  let insertedCount = 0;
  let index = 0;
  const batchSize = 50;
  const totalMessages = formattedMessages.length;
  let progressInterval: NodeJS.Timeout | undefined;

  try {
    transaction = await sequelize.transaction();

    // Send periodic progress updates
    progressInterval = setInterval(() => {
      res.write(
        `data: ${JSON.stringify({
          progress: insertedCount,
          total: totalMessages,
        })}\n\n`
      );
    }, 1000);

    // Insert messages in batches
    while (index < formattedMessages.length) {
      const batch = formattedMessages.slice(index, index + batchSize);
      const createdMessages = await Message.bulkCreate(batch, {
        transaction,
        validate: false,
        hooks: false,
        ignoreDuplicates: true,
        returning: true,
      });
      
      // Messages will be processed by Python service later
      
      insertedCount += batch.length;
      index += batchSize;
      console.log(insertedCount);
    }

    await transaction.commit();

    // Trigger Python processing automatically
    try {
      console.log("🚀 Auto-triggering Python processing...");
      const processor = new PythonProcessor();
      const result = await processor.processMessages();
      console.log(`✅ Python processing completed: ${result.processed} processed, ${result.transactions} transactions`);
    } catch (error) {
      console.log('❌ Python processing failed:', error instanceof Error ? error.message : 'Unknown error');
    }

    // Send final progress update
    res.write(
      `data: ${JSON.stringify({
        progress: totalMessages,
        total: totalMessages,
      })}\n\n`
    );

    // Ensure no further writes after ending response
    if (progressInterval) clearInterval(progressInterval);
    res.end();
  } catch (error) {
    if (transaction) {
      try {
        await transaction.rollback();
      } catch (rollbackError) {
        console.error("Error rolling back transaction:", rollbackError);
      }
    }

    if (progressInterval) clearInterval(progressInterval);

    try {
      res.write(
        `data: ${JSON.stringify({ error: "Failed to sync messages" })}\n\n`
      );
      res.end();
    } catch (err) {
      console.error("Error closing response stream:", err);
    }
  }
};
