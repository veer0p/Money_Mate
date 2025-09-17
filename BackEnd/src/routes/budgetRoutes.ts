import express from "express";
import {
  getBudgets,
  getBudgetDetails,
  updateBudget,
  createBudget,
} from "../controllers/budgetController";

const router = express.Router();

router.get("/user/:userId", getBudgets);
router.get("/:budgetId", getBudgetDetails);
router.put("/:budgetId", updateBudget);
router.post("/create", createBudget);

export default router;
