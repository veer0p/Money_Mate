import express from "express";
import { sendMessage } from "../controllers/chatController";

const router = express.Router();

router.post("/sendMessage", sendMessage);

export default router;
