import express from "express";
import { createInsight, getInsights, getInsightsData } from "../controllers/InsightController";

const router = express.Router();

router.post("/create", createInsight);
router.get("/:userId", getInsights);
router.get("/data/:userId", getInsightsData);

export default router;
