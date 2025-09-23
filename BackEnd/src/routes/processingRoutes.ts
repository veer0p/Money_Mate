import { Router } from "express";
import { Message } from "../models/messageModel";
import Transaction from "../models/transactionsModel";
import { processUnprocessedMessages, getProcessingStatus } from "../controllers/processingController";
import { sequelize } from "../config/db";

const router = Router();

// Get unprocessed messages for Python service
router.get("/messages/unprocessed", async (req, res) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : null;
    const queryOptions: any = {
      where: { processed: false }
    };
    
    if (limit) {
      queryOptions.limit = limit;
    }
    
    const messages = await Message.findAll(queryOptions);
    
    res.json({ messages });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch messages" });
  }
});

// Process all unprocessed messages
router.post("/messages/process-all", processUnprocessedMessages);

// Bulk create transactions (for Python service)
router.post("/transactions/bulk-create", async (req, res) => {
  try {
    const { transactions, processedMessageIds } = req.body;
    
    const transaction = await sequelize.transaction();
    
    try {
      // Create transactions
      if (transactions && transactions.length > 0) {
        await Transaction.bulkCreate(transactions, { 
          transaction,
          ignoreDuplicates: true,
          validate: false
        });
      }
      
      // Mark messages as processed
      if (processedMessageIds && processedMessageIds.length > 0) {
        await Message.update(
          { processed: true },
          { where: { id: processedMessageIds }, transaction }
        );
      }
      
      await transaction.commit();
      
      res.json({
        success: true,
        transactionsCreated: transactions ? transactions.length : 0,
        messagesProcessed: processedMessageIds ? processedMessageIds.length : 0
      });
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  } catch (error) {
    console.error("Error in bulk-create:", error);
    console.error("Request body:", JSON.stringify(req.body, null, 2));
    res.status(500).json({ 
      error: "Failed to create transactions",
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get processing status
router.get("/status", getProcessingStatus);



export default router;