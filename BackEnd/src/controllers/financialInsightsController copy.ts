// import { Request, Response } from "express";
// import FinancialInsight from "../models/FinancialInsightsModel";
// import { Op } from "sequelize";

// export const getFinancialInsights = async (req: Request, res: Response) => {
//   try {
//     const { userId } = req.params;
//     const { startDate, endDate } = req.query;

//     if (!userId) {
//       return res.status(400).json({
//         success: false,
//         message: "User ID is required",
//       });
//     }

//     const whereClause: any = {
//       user_id: userId,
//     };

//     if (startDate && endDate) {
//       whereClause.date_or_month = {
//         [Op.between]: [startDate, endDate],
//       };
//     }

//     const insights = await FinancialInsight.findAll({
//       where: whereClause,
//       order: [["date_or_month", "DESC"]],
//     });

//     // Process insights into structured data
//     const processedInsights = {
//       monthlySpendSummaries: insights
//         .filter((insight) => insight.insight_type === "comparison")
//         .map((insight) => ({
//           date_or_month: insight.date_or_month,
//           amount: insight.amount?.toString(),
//         })),
//       incomeVsExpenses: insights
//         .filter((insight) => insight.insight_type === "comparison")
//         .map((insight) => ({
//           date_or_month: insight.date_or_month,
//           income: insight.income?.toString(),
//           expense: insight.expense?.toString(),
//           netSavings: (insight.income || 0) - (insight.expense || 0),
//         })),
//       spendingPatterns: {
//         byDay: insights
//           .filter((insight) => insight.insight_type === "prediction")
//           .map((insight) => ({
//             date_or_month: insight.date_or_month,
//             amount: insight.amount?.toString(),
//           })),
//         byHour: insights
//           .filter((insight) => insight.insight_type === "prediction")
//           .map((insight) => ({
//             date_or_month: insight.date_or_month,
//             amount: insight.amount?.toString(),
//           })),
//       },
//       financialHealth: insights
//         .filter((insight) => insight.insight_type === "health")
//         .reduce((acc, insight) => {
//           return {
//             savingsRate: insight.savings_rate?.toString() || "0",
//             emergencyFund: {
//               balance: insight.balance?.toString() || "0",
//               monthsCovered: insight.emergency_fund_months,
//             },
//             debtToIncomeRatio: insight.debt_to_income_ratio || 0,
//             investmentRatio: insight.investment_ratio || 0,
//             creditUtilization: insight.credit_utilization || 0,
//             monthlyBudgetAdherence: insight.monthly_budget_adherence || 0,
//             financialScore: calculateFinancialScore({
//               savingsRate: insight.savings_rate || 0,
//               debtToIncomeRatio: insight.debt_to_income_ratio || 0,
//               investmentRatio: insight.investment_ratio || 0,
//               creditUtilization: insight.credit_utilization || 0,
//               monthlyBudgetAdherence: insight.monthly_budget_adherence || 0,
//             }),
//           };
//         }, {}),
//       savingsOpportunities: insights
//         .filter((insight) => insight.insight_type === "suggestion")
//         .map((insight) => ({
//           category: insight.category || "",
//           amount: insight.amount?.toString() || "0",
//         })),
//       alerts: insights
//         .filter((insight) => insight.is_alert && !insight.alert_resolved)
//         .map((insight) => ({
//           date_or_month: insight.date_or_month,
//           amount: insight.amount?.toString() || "0",
//           notes: insight.notes || "",
//           severity: insight.alert_severity || "low",
//           resolved: insight.alert_resolved,
//         })),
//     };

//     res.status(200).json({
//       success: true,
//       data: processedInsights,
//     });
//   } catch (error) {
//     console.error("Error fetching financial insights:", error);
//     res.status(500).json({
//       success: false,
//       message: "Internal server error",
//     });
//   }
// };

// function calculateFinancialScore(metrics: {
//   savingsRate: number;
//   debtToIncomeRatio: number;
//   investmentRatio: number;
//   creditUtilization: number;
//   monthlyBudgetAdherence: number;
// }): number {
//   // Normalize each metric to a 0-1 scale
//   const normalizedMetrics = {
//     savingsRate: Math.min(metrics.savingsRate, 0.5) / 0.5, // Cap at 50% savings rate
//     debtToIncomeRatio: Math.max(0, 1 - metrics.debtToIncomeRatio / 0.5), // Cap at 50% DTI
//     investmentRatio: Math.min(metrics.investmentRatio, 0.2) / 0.2, // Cap at 20% investment ratio
//     creditUtilization: Math.max(0, 1 - metrics.creditUtilization / 0.3), // Cap at 30% credit utilization
//     monthlyBudgetAdherence: metrics.monthlyBudgetAdherence,
//   };

//   // Calculate weighted average
//   const weights = {
//     savingsRate: 0.3,
//     debtToIncomeRatio: 0.25,
//     investmentRatio: 0.2,
//     creditUtilization: 0.15,
//     monthlyBudgetAdherence: 0.1,
//   };

//   const score = Object.entries(normalizedMetrics).reduce(
//     (sum, [key, value]) => sum + value * weights[key as keyof typeof weights],
//     0
//   );

//   // Convert to 0-10 scale
//   return Math.round(score * 10 * 10) / 10;
// }
