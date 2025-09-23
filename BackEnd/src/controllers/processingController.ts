import { Request, Response } from "express";
import { Message } from "../models/messageModel";
import Transaction from "../models/transactionsModel";
import { PythonProcessor } from "../services/pythonProcessor";

// Process unprocessed messages using integrated Python
export const processUnprocessedMessages = async (req: Request, res: Response): Promise<void> => {
  try {
    const { limit } = req.body;
    const messageLimit = limit ? parseInt(limit) : null;
    
    if (messageLimit) {
      console.log(`🚀 Starting integrated Python processing with limit: ${messageLimit}...`);
    } else {
      console.log(`🚀 Starting integrated Python processing for ALL messages...`);
    }
    
    const processor = new PythonProcessor();
    const result = await processor.processMessages(messageLimit);
    
    res.json({
      message: "Processing completed successfully",
      processed: result.processed,
      transactions: result.transactions
    });
  } catch (error) {
    console.error("Error running Python processor:", error);
    res.status(500).json({ 
      error: "Failed to process messages",
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Get processing status
export const getProcessingStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const totalMessages = await Message.count();
    const processedMessages = await Message.count({ where: { processed: true } });
    const unprocessedMessages = totalMessages - processedMessages;

    res.json({
      total: totalMessages,
      processed: processedMessages,
      unprocessed: unprocessedMessages,
      percentage: totalMessages > 0 ? Math.round((processedMessages / totalMessages) * 100) : 0
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to get processing status" });
  }
};