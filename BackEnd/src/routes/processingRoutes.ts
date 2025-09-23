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
    
    console.log(`Bulk-create request: ${transactions?.length || 0} transactions, ${processedMessageIds?.length || 0} messages`);
    
    const transaction = await sequelize.transaction();
    
    let transactionsWithIds: any[] = [];
    
    try {
      // Create transactions (duplicates already filtered by Python)
      if (transactions && transactions.length > 0) {
        // Filter out transactions with existing reference_ids
        const referenceIds = transactions
          .map((txn: any) => txn.reference_id)
          .filter((id: any) => id !== null && id !== undefined);
        
        let existingRefIds = new Set();
        
        if (referenceIds.length > 0) {
          const existingTransactions = await Transaction.findAll({
            where: { reference_id: referenceIds },
            attributes: ['reference_id'],
            transaction
          });
          existingRefIds = new Set(existingTransactions.map(t => t.reference_id));
        }
        
        // Add UUID and validate transaction data before insertion
        transactionsWithIds = transactions
          .filter((txn: any) => !txn.reference_id || !existingRefIds.has(txn.reference_id))
          .map((txn: any) => {
            if (!txn.user_id || !txn.amount || !txn.transaction_type || !txn.transaction_date) {
              throw new Error(`Invalid transaction data: ${JSON.stringify(txn)}`);
            }
            const now = new Date();
            return {
              ...txn,
              id: require('uuid').v4(),
              created_at: now,
              updated_at: now
            };
          });
        
        if (transactionsWithIds.length > 0) {
          await Transaction.bulkCreate(transactionsWithIds, { 
            transaction,
            validate: true,
            ignoreDuplicates: true
          });
        }
        
        const duplicatesFiltered = transactions.length - transactionsWithIds.length;
        console.log(`Created ${transactionsWithIds.length} transactions, filtered ${duplicatesFiltered} duplicates`);
      }
      
      // Mark messages as processed
      if (processedMessageIds && processedMessageIds.length > 0) {
        const updateResult = await Message.update(
          { processed: true },
          { where: { id: processedMessageIds }, transaction }
        );
        console.log(`Marked ${updateResult[0]} messages as processed`);
      }
      
      await transaction.commit();
      
      res.json({
        success: true,
        transactionsCreated: transactionsWithIds.length,
        messagesProcessed: processedMessageIds ? processedMessageIds.length : 0
      });
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  } catch (error) {
    console.error("Error in bulk-create:", error);
    console.error("Request body sample:", JSON.stringify(req.body?.transactions?.[0], null, 2));
    res.status(500).json({ 
      error: "Failed to create transactions",
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get processing status
router.get("/status", getProcessingStatus);



export default router;