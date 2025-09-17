import FinancialInsight from "../models/FinancialInsightsModel";
import { Request, Response } from "express";

export const createInsight = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { user_id, insight_type, data_value } = req.body;

    if (!user_id || !insight_type || !data_value) {
      res.status(400).json({
        status: "error",
        message: "user_id, insight_type, and data_value are required",
      });
      return;
    }

    const insight = await FinancialInsight.create({
      user_id,
      insight_type,
      data_value,
    });

    res.status(201).json({
      status: "success",
      message: "Insight created successfully",
      data: insight,
    });
  } catch (error: any) {
    console.error("Error creating insight:", error);
    res.status(500).json({
      status: "error",
      message: "Internal server error",
    });
  }
};

export const getInsights = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { userId } = req.params;

    if (!userId) {
      res.status(400).json({
        status: "error",
        message: "User ID is required",
      });
      return;
    }

    const insights = await FinancialInsight.findAll({
      where: { user_id: userId },
      attributes: ["id", "insight_type", "data_value", "generated_at"],
    });

    res.status(200).json({
      status: "success",
      message: "Insights retrieved successfully",
      data: insights,
    });
  } catch (error: any) {
    console.error("Error fetching insights:", error);
    res.status(500).json({
      status: "error",
      message: "Internal server error",
    });
  }
};
