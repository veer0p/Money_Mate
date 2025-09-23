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

    // Get all transactions first to determine actual date range
    const allTransactions = await Transaction.findAll({
      where: { user_id },
      order: [['transaction_date', 'ASC']]
    });

    if (allTransactions.length === 0) {
      res.status(200).json({
        status: "success",
        message: "No transactions found",
        data: { series: [{ name: "Total Amount", data: [] }], labels: [] }
      });
      return;
    }

    // Use actual transaction date range instead of assuming current year
    const actualEndDate = new Date(Math.max(...allTransactions.map(t => new Date(t.transaction_date).getTime())));
    const actualStartDate = new Date(actualEndDate);
    actualStartDate.setMonth(actualEndDate.getMonth() - 11);

    console.log(`Transaction Trend - Actual date range: ${actualStartDate.toISOString()} to ${actualEndDate.toISOString()}`);

    const transactions = allTransactions.filter(t => {
      const tDate = new Date(t.transaction_date);
      return tDate >= actualStartDate && tDate <= actualEndDate;
    });

    console.log(`Found ${transactions.length} transactions for trend analysis`);

    // Initialize the result arrays
    const labels: string[] = [];
    const amounts: number[] = [];

    // Generate labels for the last 12 months
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
    let currentDate = new Date(actualStartDate);
    while (currentDate <= actualEndDate) {
      const month = monthNames[currentDate.getMonth()];
      const year = currentDate.getFullYear().toString().slice(-2);
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

    // Get the most recent transaction date to base "current week" on
    const latestTransaction = await Transaction.findOne({
      where: { user_id },
      order: [['transaction_date', 'DESC']]
    });

    if (!latestTransaction) {
      res.status(200).json({
        status: "success",
        message: "No transactions found",
        data: { categories: ["No Data"], amounts: [0], totalSpent: 0, totalReceived: 0, period: "No Data" }
      });
      return;
    }

    // Use the latest transaction date as reference instead of server time
    const referenceDate = new Date(latestTransaction.transaction_date);
    let startOfWeek = new Date(referenceDate);
    let endOfWeek = new Date(referenceDate);
    startOfWeek.setDate(referenceDate.getDate() - referenceDate.getDay() + 1);
    endOfWeek.setDate(referenceDate.getDate() - referenceDate.getDay() + 7);
    
    console.log(`Distribution - Week range based on latest transaction: ${startOfWeek.toISOString()} to ${endOfWeek.toISOString()}`);
    console.log(`Latest transaction date: ${latestTransaction.transaction_date.toISOString()}`);

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
      "Raw Transactions:",
      transactions.map((t) => ({
        id: t.id,
        description: t.description?.substring(0, 50),
        amount: t.amount,
        category: t.category,
        transaction_type: t.transaction_type,
        transaction_date: t.transaction_date,
      }))
    );

    // Group transactions by category and transaction type
    const debitCategoryAmounts: { [key: string]: number } = {};
    const creditCategoryAmounts: { [key: string]: number } = {};
    let totalSpent = 0;
    let totalReceived = 0;

    transactions.forEach((transaction) => {
      const category = transaction.category || "Other";
      const amount = Number(transaction.amount) || 0;
      const transactionType = transaction.transaction_type?.toLowerCase();

      console.log(`Processing transaction: ${transaction.description?.substring(0, 30)} - Type: '${transaction.transaction_type}' - Amount: ${amount}`);

      if (transactionType === "debit") {
        if (!debitCategoryAmounts[category]) {
          debitCategoryAmounts[category] = 0;
        }
        debitCategoryAmounts[category] += amount;
        totalSpent += amount;
        console.log(`Added to DEBIT - Category: ${category}, Amount: ${amount}`);
      } else if (transactionType === "credit") {
        if (!creditCategoryAmounts[category]) {
          creditCategoryAmounts[category] = 0;
        }
        creditCategoryAmounts[category] += amount;
        totalReceived += amount;
        console.log(`Added to CREDIT - Category: ${category}, Amount: ${amount}`);
      } else {
        console.warn(`Unknown transaction type: '${transaction.transaction_type}' for transaction ${transaction.id}`);
      }
    });

    console.log("Debit category amounts:", debitCategoryAmounts);
    console.log("Credit category amounts:", creditCategoryAmounts);
    console.log("Total Spent (calculated):", totalSpent);
    console.log("Total Received (calculated):", totalReceived);

    // Combine categories for pie chart (showing only debit transactions for spending analysis)
    const categories = Object.keys(debitCategoryAmounts).length > 0
      ? Object.keys(debitCategoryAmounts)
      : ["No Spending"];
    const amounts = Object.keys(debitCategoryAmounts).length > 0
      ? Object.values(debitCategoryAmounts)
      : [0];

    console.log("Final categories for pie chart:", categories);
    console.log("Final amounts for pie chart:", amounts);

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
// Debug endpoint to check all transactions in database
export const getAllTransactionsDebug = async (
  req: Request<{ user_id: string }>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { user_id } = req.params;

    const transactions = await Transaction.findAll({
      where: { user_id },
      order: [['transaction_date', 'DESC']],
      limit: 20
    });

    console.log(`Debug: Found ${transactions.length} total transactions for user ${user_id}`);
    transactions.forEach((t, i) => {
      console.log(`${i + 1}. ${t.transaction_date.toISOString()} - ${t.description?.substring(0, 30)} - ${t.amount}`);
    });

    res.status(200).json({
      status: "success",
      message: "All transactions retrieved for debugging",
      data: transactions.map(t => ({
        id: t.id,
        description: t.description,
        amount: t.amount,
        transaction_date: t.transaction_date.toISOString(),
        category: t.category,
        transaction_type: t.transaction_type
      }))
    });
  } catch (error) {
    console.error("Error in debug endpoint:", error);
    res.status(500).json({
      status: "error",
      message: "Internal server error"
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

    // Get the most recent transaction date to determine "today"
    const latestTransaction = await Transaction.findOne({
      where: { user_id },
      order: [['transaction_date', 'DESC']]
    });

    if (!latestTransaction) {
      res.status(200).json({
        status: "success",
        message: "No transactions found",
        data: [],
        period: "No Data"
      });
      return;
    }

    const referenceDate = new Date(latestTransaction.transaction_date);
    const startOfDay = new Date(referenceDate.getFullYear(), referenceDate.getMonth(), referenceDate.getDate(), 0, 0, 0, 0);
    const endOfDay = new Date(referenceDate.getFullYear(), referenceDate.getMonth(), referenceDate.getDate(), 23, 59, 59, 999);

    console.log(
      `Fetching transactions for latest transaction date ${startOfDay.toISOString()} to ${endOfDay.toISOString()}`
    );
    console.log(`Latest transaction: ${latestTransaction.transaction_date.toISOString()}`);

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
