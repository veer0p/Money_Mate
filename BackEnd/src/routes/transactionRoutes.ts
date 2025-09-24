import { Router } from "express";
import { getTransactions, getTransactionCategories } from "../controllers/transactionsController";

const router = Router();

// Route to get transactions by user_id with pagination, sorting, and filters
router.get("/user/:user_id", getTransactions);

// Route to get unique categories for a user
router.get("/user/:user_id/categories", getTransactionCategories);

export default router;
