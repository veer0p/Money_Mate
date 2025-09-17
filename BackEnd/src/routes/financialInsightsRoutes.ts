import express from "express";
import { getFinancialInsights } from "../controllers/financialInsightsController";

const router = express.Router();

// Get financial insights for a specific user
router.get("/:user_id", getFinancialInsights);

export default router;
