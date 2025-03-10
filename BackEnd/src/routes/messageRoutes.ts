import express from "express";
import { storeMessage } from "../controllers/messageController"; // Import the controller
import { exportMessagesToCSV } from "../controllers/messageController";
import authMiddleware from "../middleware/authMiddleware"; // Optional: Add authentication middleware if needed

const router = express.Router();

// Bulk insert messages
router.post("/send", storeMessage); // Add authMiddleware if required
router.post("/export", exportMessagesToCSV); // Add authMiddleware if required

export default router;
