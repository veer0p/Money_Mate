import express from "express";
import {
  createSuspiciousMessage,
  getSuspiciousMessages,
} from "../controllers/suspiciousMessagesController";

const router = express.Router();

router.post("/create", createSuspiciousMessage);
router.get("/:userId", getSuspiciousMessages);

export default router;
