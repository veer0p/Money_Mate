import { Request, Response, NextFunction } from "express";
import Transaction from "../models/transactionsModel";
import User from "../models/userModel";

// Get all transactions for a specific user
export const getTransactions = async (
  req: Request<{ user_id: string }>, // Specify the params type
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { user_id } = req.params;

    // Validate user_id
    if (!user_id) {
      res.status(400).json({
        status: "error",
        message: "User ID is required",
      });
      return;
    }

    // Check if the user exists
    const user = await User.findByPk(user_id);
    if (!user) {
      res.status(404).json({
        status: "error",
        message: "User not found",
      });
      return;
    }

    // Fetch transactions for the user
    const transactions = await Transaction.findAll({
      where: { user_id },
      order: [["transaction_date", "DESC"]], // Order by transaction date, newest first
    });

    // If no transactions found
    if (!transactions || transactions.length === 0) {
      res.status(200).json({
        status: "success",
        message: "No transactions found for this user",
        data: [],
      });
      return;
    }

    // Return the transactions
    res.status(200).json({
      status: "success",
      message: "Transactions retrieved successfully",
      data: transactions,
    });
  } catch (error) {
    console.error("Error fetching transactions:", error);
    res.status(500).json({
      status: "error",
      message: "Internal server error",
    });
  }
};
