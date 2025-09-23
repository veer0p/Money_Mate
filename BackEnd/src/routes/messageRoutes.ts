import express from "express";
import { storeMessage, getLastSyncTime } from "../controllers/messageController"; // Import the controller
import { exportMessagesToCSV } from "../controllers/messageController";
import authMiddleware from "../middleware/authMiddleware"; // Optional: Add authentication middleware if needed

const router = express.Router();

// Get last sync time
router.get("/last-sync", getLastSyncTime);
// Bulk insert messages
router.post("/send", storeMessage); // Add authMiddleware if required
router.post("/export", exportMessagesToCSV); // Add authMiddleware if required

export default router;
