import { Request, Response } from "express";
import FinancialInsight from "../models/FinancialInsightsModel";

export const getFinancialInsights = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { user_id } = req.params;

    if (!user_id) {
      res.status(400).json({ success: false, message: "User ID is required" });
      return;
    }

    const insights = await FinancialInsight.findAll({
      where: { user_id },
    });

    const groupedInsights = {
      monthlySpendSummaries: insights
        .filter((i) => i.insight_type === "Monthly Spend Summary")
        .map((i) => ({
          date_or_month: i.date_or_month,
          amount: i.amount,
        })),
      incomeVsExpenses: insights
        .filter((i) => i.insight_type === "Income vs Expense")
        .map((i) => ({
          date_or_month: i.date_or_month,
          income: i.income,
          expense: i.expense,
          netSavings: i.notes ? parseFloat(i.notes.split(": ")[1]) : null,
        })),
      spendingPatterns: {
        byDay: insights
          .filter((i) => i.insight_type === "Spending Pattern - Day")
          .map((i) => ({ date_or_month: i.date_or_month, amount: i.amount })),
        byHour: insights
          .filter((i) => i.insight_type === "Spending Pattern - Hour")
          .map((i) => ({ date_or_month: i.date_or_month, amount: i.amount })),
      },
      financialHealth: {
        savingsRate:
          insights.find(
            (i) => i.insight_type === "Financial Health - Savings Rate"
          )?.amount || null,
        emergencyFund:
          insights
            .filter(
              (i) => i.insight_type === "Financial Health - Emergency Fund"
            )
            .map((i) => ({
              balance: i.balance,
              monthsCovered: i.notes ? parseFloat(i.notes.split(" ")[2]) : null,
            }))[0] || null,
      },
      savingsOpportunities: insights
        .filter((i) => i.insight_type === "Savings Opportunity - Top Category")
        .map((i) => ({ category: i.category, amount: i.amount })),
      alerts: insights
        .filter((i) => i.insight_type === "Alert - Unusual Spending")
        .map((i) => ({
          date_or_month: i.date_or_month,
          amount: i.amount,
          notes: i.notes,
        })),
    };

    res.status(200).json({
      success: true,
      data: groupedInsights,
    });
  } catch (error) {
    console.error("Error fetching financial insights:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch financial insights",
    });
  }
};
