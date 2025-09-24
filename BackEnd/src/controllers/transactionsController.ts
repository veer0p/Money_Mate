import { Request, Response, NextFunction } from "express";
import { Op, WhereOptions } from "sequelize";
import Transaction from "../models/transactionsModel";
import User from "../models/userModel";

interface TransactionQuery {
  page?: string;
  limit?: string;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
  startDate?: string;
  endDate?: string;
  transaction_type?: 'credit' | 'debit';
  category?: string | string[];
  minAmount?: string;
  maxAmount?: string;
  account_number?: string;
  search?: string;
}

// Get all transactions for a specific user with pagination, sorting, and filters
export const getTransactions = async (
  req: Request<{ user_id: string }, {}, {}, TransactionQuery>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { user_id } = req.params;
    const {
      page = '1',
      limit = '10',
      sortBy = 'transaction_date',
      sortOrder = 'DESC',
      startDate,
      endDate,
      transaction_type,
      category,
      minAmount,
      maxAmount,
      account_number,
      search
    } = req.query;

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

    // Pagination
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
    const offset = (pageNum - 1) * limitNum;

    // Sorting validation
    const allowedSortFields = ['transaction_date', 'amount', 'transaction_type', 'category', 'account_number'];
    const validSortBy = allowedSortFields.includes(sortBy) ? sortBy : 'transaction_date';
    const validSortOrder = ['ASC', 'DESC'].includes(sortOrder) ? sortOrder : 'DESC';

    // Build where conditions
    const whereConditions: WhereOptions = { user_id };

    // Date range filter
    if (startDate || endDate) {
      whereConditions.transaction_date = {};
      if (startDate) {
        whereConditions.transaction_date[Op.gte] = new Date(startDate);
      }
      if (endDate) {
        const endDateTime = new Date(endDate);
        endDateTime.setHours(23, 59, 59, 999);
        whereConditions.transaction_date[Op.lte] = endDateTime;
      }
    }

    // Transaction type filter
    if (transaction_type && ['credit', 'debit'].includes(transaction_type)) {
      whereConditions.transaction_type = transaction_type;
    }

    // Category filter
    if (category) {
      if (Array.isArray(category)) {
        whereConditions.category = { [Op.in]: category };
      } else {
        whereConditions.category = category;
      }
    }

    // Amount range filter
    if (minAmount || maxAmount) {
      whereConditions.amount = {};
      if (minAmount) {
        whereConditions.amount[Op.gte] = parseFloat(minAmount);
      }
      if (maxAmount) {
        whereConditions.amount[Op.lte] = parseFloat(maxAmount);
      }
    }

    // Account number filter
    if (account_number) {
      whereConditions.account_number = account_number;
    }

    // Search filter (description or reference_id)
    if (search) {
      (whereConditions as any)[Op.or] = [
        { description: { [Op.iLike]: `%${search}%` } },
        { reference_id: { [Op.iLike]: `%${search}%` } }
      ];
    }

    // Get total count for pagination
    const totalCount = await Transaction.count({ where: whereConditions });
    const totalPages = Math.ceil(totalCount / limitNum);

    // Fetch transactions with filters, sorting, and pagination
    const transactions = await Transaction.findAll({
      where: whereConditions,
      order: [[validSortBy, validSortOrder]],
      limit: limitNum,
      offset: offset,
      attributes: [
        'id',
        'account_number',
        'transaction_type',
        'category',
        'amount',
        'currency',
        'transaction_date',
        'description',
        'reference_id'
      ]
    });

    // Return paginated results
    res.status(200).json({
      status: "success",
      message: "Transactions retrieved successfully",
      data: {
        transactions,
        pagination: {
          currentPage: pageNum,
          totalPages,
          totalItems: totalCount,
          itemsPerPage: limitNum,
          hasNextPage: pageNum < totalPages,
          hasPrevPage: pageNum > 1
        },
        filters: {
          sortBy: validSortBy,
          sortOrder: validSortOrder,
          appliedFilters: {
            dateRange: startDate || endDate ? { startDate, endDate } : null,
            transactionType: transaction_type || null,
            category: category || null,
            amountRange: minAmount || maxAmount ? { minAmount, maxAmount } : null,
            accountNumber: account_number || null,
            search: search || null
          }
        }
      }
    });
  } catch (error) {
    console.error("Error fetching transactions:", error);
    res.status(500).json({
      status: "error",
      message: "Internal server error",
    });
  }
};

// Get unique categories for filter dropdown
export const getTransactionCategories = async (
  req: Request<{ user_id: string }>,
  res: Response
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

    const categories = await Transaction.findAll({
      where: { 
        user_id,
        category: { [Op.ne]: null }
      },
      attributes: ['category'],
      group: ['category'],
      order: [['category', 'ASC']]
    });

    const categoryList = categories.map(t => t.category).filter(Boolean);

    res.status(200).json({
      status: "success",
      data: categoryList
    });
  } catch (error) {
    console.error("Error fetching categories:", error);
    res.status(500).json({
      status: "error",
      message: "Internal server error",
    });
  }
};
