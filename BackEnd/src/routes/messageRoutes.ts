import express from "express";
import { storeMessage } from "../controllers/messageController"; // Correct import

const router = express.Router();

router.post("/store", storeMessage); // Correct usage

export default router;
