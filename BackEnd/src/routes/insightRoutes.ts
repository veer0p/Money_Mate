import express from "express";
import { createInsight, getInsights } from "../controllers/InsightController";

const router = express.Router();

router.post("/create", createInsight);
router.get("/:userId", getInsights);

export default router;
