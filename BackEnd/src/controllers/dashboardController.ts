// src/controllers/dashboardController.ts
import { Request, Response, NextFunction } from "express";
import Transaction from "../models/transactionsModel";
import User from "../models/userModel";
import { Op } from "sequelize";

// Get dashboard summary for a specific user
export const getDashboardSummary = async (
  req: Request<{ user_id: string }>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { user_id } = req.params;

    if (!user_id) {
      res.status(400).json({
        status: "error",
        message: "User ID is required",
      });
      return;
    }

    const user = await User.findByPk(user_id);
    if (!user) {
      res.status(404).json({
        status: "error",
        message: "User not found",
      });
      return;
    }

    const transactions = await Transaction.findAll({
      where: { user_id },
    });

    if (!transactions || transactions.length === 0) {
      res.status(200).json({
        status: "success",
        message: "No transactions found for this user",
        data: {
          totalTransactions: 0,
          totalAmountSpent: 0,
          totalAmountReceived: 0,
          averageTransactionAmount: 0,
        },
      });
      return;
    }

    const totalTransactions = transactions.length;
    const totalAmountSpent = transactions
      .filter((t) => t.transaction_type === "debit")
      .reduce((sum, t) => sum + Number(t.amount), 0);
    const totalAmountReceived = transactions
      .filter((t) => t.transaction_type === "credit")
      .reduce((sum, t) => sum + Number(t.amount), 0);
    const averageTransactionAmount =
      transactions.reduce((sum, t) => sum + Number(t.amount), 0) /
      totalTransactions;

    res.status(200).json({
      status: "success",
      message: "Dashboard summary retrieved successfully",
      data: {
        totalTransactions,
        totalAmountSpent,
        totalAmountReceived,
        averageTransactionAmount: Number(averageTransactionAmount.toFixed(2)),
      },
    });
  } catch (error) {
    console.error("Error fetching dashboard summary:", error);
    res.status(500).json({
      status: "error",
      message: "Internal server error",
    });
  }
};

// Get transaction trend (total amount per month) for the last 12 months
export const getTransactionTrend = async (
  req: Request<{ user_id: string }>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { user_id } = req.params;

    if (!user_id) {
      res.status(400).json({
        status: "error",
        message: "User ID is required",
      });
      return;
    }

    const user = await User.findByPk(user_id);
    if (!user) {
      res.status(404).json({
        status: "error",
        message: "User not found",
      });
      return;
    }

    // Calculate the date range (last 12 months)
    const endDate = new Date(); // Current date (March 28, 2025)
    const startDate = new Date();
    startDate.setMonth(endDate.getMonth() - 11); // Go back 12 months (April 2024)

    // Fetch transactions within the date range
    const transactions = await Transaction.findAll({
      where: {
        user_id,
        transaction_date: {
          [Op.between]: [startDate, endDate],
        },
      },
    });

    // Initialize the result arrays
    const labels: string[] = [];
    const amounts: number[] = [];

    // Generate labels for the last 12 months (Apr'24 to Mar'25)
    const monthNames = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    let currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      const month = monthNames[currentDate.getMonth()];
      const year = currentDate.getFullYear().toString().slice(-2); // e.g., "24" for 2024
      labels.push(`${month}'${year}`);
      currentDate.setMonth(currentDate.getMonth() + 1);
    }

    // Group transactions by month and calculate total amount
    const monthlyAmounts: { [key: string]: number } = {};
    labels.forEach((label) => {
      monthlyAmounts[label] = 0;
    });

    transactions.forEach((transaction) => {
      const date = new Date(transaction.transaction_date);
      const month = monthNames[date.getMonth()];
      const year = date.getFullYear().toString().slice(-2);
      const key = `${month}'${year}`;
      if (monthlyAmounts[key] !== undefined) {
        monthlyAmounts[key] += Number(transaction.amount);
      }
    });

    // Convert monthly amounts to an array
    amounts.push(...Object.values(monthlyAmounts));

    res.status(200).json({
      status: "success",
      message: "Transaction trend retrieved successfully",
      data: {
        series: [
          {
            name: "Total Amount",
            data: amounts,
          },
        ],
        labels,
      },
    });
  } catch (error) {
    console.error("Error fetching transaction trend:", error);
    res.status(500).json({
      status: "error",
      message: "Internal server error",
    });
  }
};

// Get transaction distribution by category for the current week
export const getTransactionDistribution = async (
  req: Request<{ user_id: string }>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { user_id } = req.params;

    if (!user_id) {
      res.status(400).json({
        status: "error",
        message: "User ID is required",
      });
      return;
    }

    const user = await User.findByPk(user_id);
    if (!user) {
      res.status(404).json({
        status: "error",
        message: "User not found",
      });
      return;
    }

    // Calculate the date range for the current week (Monday to Sunday)
    const today = new Date();
    let startOfWeek = new Date(today);
    let endOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay() + 1); // Monday
    endOfWeek.setDate(today.getDate() - today.getDay() + 7); // Sunday

    let transactions = await Transaction.findAll({
      where: {
        user_id,
        transaction_date: {
          [Op.between]: [startOfWeek, endOfWeek],
        },
      },
    });

    let periodLabel = "This Week";
    if (transactions.length === 0) {
      periodLabel = "Last Week";
      startOfWeek.setDate(startOfWeek.getDate() - 7);
      endOfWeek.setDate(endOfWeek.getDate() - 7);
      transactions = await Transaction.findAll({
        where: {
          user_id,
          transaction_date: {
            [Op.between]: [startOfWeek, endOfWeek],
          },
        },
      });

      let weeksBack = 1;
      while (transactions.length === 0 && weeksBack < 4) {
        weeksBack++;
        periodLabel = `${weeksBack} Weeks Ago`;
        startOfWeek.setDate(startOfWeek.getDate() - 7);
        endOfWeek.setDate(endOfWeek.getDate() - 7);
        transactions = await Transaction.findAll({
          where: {
            user_id,
            transaction_date: {
              [Op.between]: [startOfWeek, endOfWeek],
            },
          },
        });
      }
    }

    console.log(
      `Found ${transactions.length} transactions for period ${periodLabel}`
    );
    console.log(
      "Transactions:",
      transactions.map((t) => ({
        description: t.description,
        amount: t.amount,
        category: t.category,
        transaction_type: t.transaction_type,
        transaction_date: t.transaction_date,
      }))
    );

    // Group transactions by category and calculate total amount
    const categoryAmounts: { [key: string]: number } = {};
    let totalSpent = 0;
    let totalReceived = 0;

    transactions.forEach((transaction) => {
      const category = transaction.category || "Other";
      if (!categoryAmounts[category]) {
        categoryAmounts[category] = 0;
      }
      const amount = Number(transaction.amount) || 0;
      categoryAmounts[category] += amount;

      if (transaction.transaction_type === "debit") {
        totalSpent += amount;
      } else if (transaction.transaction_type === "credit") {
        totalReceived += amount;
      }
    });

    console.log("Category amounts:", categoryAmounts);

    // Ensure at least one category if there are transactions
    const categories =
      Object.keys(categoryAmounts).length > 0
        ? Object.keys(categoryAmounts)
        : ["Other"];
    const amounts =
      Object.keys(categoryAmounts).length > 0
        ? Object.values(categoryAmounts)
        : [0];

    res.status(200).json({
      status: "success",
      message: "Transaction distribution retrieved successfully",
      data: {
        categories,
        amounts,
        totalSpent: Number(totalSpent.toFixed(2)),
        totalReceived: Number(totalReceived.toFixed(2)),
        period: periodLabel,
      },
    });
  } catch (error) {
    console.error("Error fetching transaction distribution:", error);
    res.status(500).json({
      status: "error",
      message: "Internal server error",
    });
  }
};
// Get recent transactions for today
export const getRecentTransactions = async (
  req: Request<{ user_id: string }>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { user_id } = req.params;

    if (!user_id) {
      res.status(400).json({
        status: "error",
        message: "User ID is required",
      });
      return;
    }

    const user = await User.findByPk(user_id);
    if (!user) {
      res.status(404).json({
        status: "error",
        message: "User not found",
      });
      return;
    }

    // Calculate the date range for today
    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const endOfDay = new Date(today.setHours(23, 59, 59, 999));

    console.log(
      `Fetching transactions for user ${user_id} on ${startOfDay} to ${endOfDay}`
    );

    // Fetch transactions for today
    let transactions = await Transaction.findAll({
      where: {
        user_id,
        transaction_date: {
          [Op.between]: [startOfDay, endOfDay],
        },
      },
      order: [["transaction_date", "DESC"]],
      limit: 5,
    });

    let periodLabel = "Today";
    console.log(`Found ${transactions.length} transactions for today`);

    // If no transactions are found for today, fetch the 5 most recent transactions
    if (transactions.length === 0) {
      periodLabel = "Recent";
      console.log(
        `Fetching the 5 most recent transactions for user ${user_id}`
      );
      transactions = await Transaction.findAll({
        where: {
          user_id,
        },
        order: [["transaction_date", "DESC"]],
        limit: 5,
      });
      console.log(`Found ${transactions.length} recent transactions`);
    }

    // Format the transactions for the frontend
    const formattedTransactions = transactions.map((transaction) => {
      const amount = Number(transaction.amount); // Convert to number
      if (isNaN(amount)) {
        console.warn(
          `Invalid amount for transaction ${transaction.id}: ${transaction.amount}`
        );
      }
      return {
        description: transaction.description,
        amount: isNaN(amount) ? 0 : Number(amount.toFixed(2)), // Fallback to 0 if invalid
        transaction_date: transaction.transaction_date.toISOString(),
        category: transaction.category || "Other",
      };
    });

    res.status(200).json({
      status: "success",
      message: "Recent transactions retrieved successfully",
      data: formattedTransactions,
      period: periodLabel,
    });
  } catch (error) {
    console.error("Error fetching recent transactions:", error);
    res.status(500).json({
      status: "error",
      message: "Internal server error",
    });
  }
};
