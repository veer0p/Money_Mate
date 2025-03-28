import { Router } from "express";
import { getTransactions } from "../controllers/transactionsController";

const router = Router();

// Route to get transactions by user_id
router.get("/user/:user_id", getTransactions);

export default router;
