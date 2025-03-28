// src/routes/dashboardRoutes.ts
import { Router } from "express";
import {
  getDashboardSummary,
  getRecentTransactions,
  getTransactionDistribution,
  getTransactionTrend,
} from "../controllers/dashboardController";

const router = Router();

// Route to get dashboard summary for a user (Summary Cards)
router.get("/summary/:user_id", getDashboardSummary);

// Route to get transaction trend (Area Chart: Total Transaction Amount Over Time)
router.get("/trend/:user_id", getTransactionTrend);

// Route to get transaction distribution (Polar Area Chart: Transaction Amount Distribution by Category)
router.get("/distribution/:user_id", getTransactionDistribution);

// Route to get recent transactions (List: Recent Transactions)
router.get("/recent/:user_id", getRecentTransactions);

export default router;
