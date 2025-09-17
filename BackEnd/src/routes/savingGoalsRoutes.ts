import express from "express";
import {
  getSavingGoals,
  getSavingGoalDetails,
  updateSavingGoal,
  createSavingGoal,
} from "../controllers/savingGoalsController";

const router = express.Router();

router.get("/user/:userId", getSavingGoals);
router.get("/:goalId", getSavingGoalDetails);
router.put("/:goalId", updateSavingGoal);
router.post("/create", createSavingGoal);

export default router;
