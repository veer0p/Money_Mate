import { Request, Response } from "express";
import { Op, Sequelize } from "sequelize";
import Budget from "../models/budgetModel";
import BudgetCategory from "../models/budgetCategoriesModel";
import { sequelize } from "../config/db";
import Category from "../models/categoryModel";

export const getBudgets = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { userId } = req.params;
    const { search } = req.query;
    if (!userId) {
      res.status(400).json({ status: "error", message: "userId is required" });
      return;
    }

    const budgets = await Budget.findAll({
      where: {
        user_id: userId,
        status: "active",
        is_delete: false,
        ...(search && { budget_name: { [Op.iLike]: `%${search}%` } }),
      },
      attributes: [
        "id",
        "budget_name",
        "total_amount",
        "start_date",
        "end_date",
      ],
      include: [
        {
          model: BudgetCategory,
          as: "budget_categories",
          attributes: ["id", "category_id", "amount"],
          include: [
            {
              model: Category,
              as: "category",
              attributes: ["name"],
            },
          ],
        },
      ],
    });

    if (!budgets.length) {
      res
        .status(404)
        .json({ status: "error", message: "No active budgets found" });
      return;
    }

    res
      .status(200)
      .json({ status: "success", message: "Budgets retrieved", data: budgets });
  } catch (error: any) {
    console.error("Error fetching budgets:", error);
    res.status(500).json({ status: "error", message: "Internal server error" });
  }
};

export const getBudgetDetails = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { budgetId } = req.params;
    if (!budgetId) {
      res
        .status(400)
        .json({ status: "error", message: "budgetId is required" });
      return;
    }

    const budget = await Budget.findOne({
      where: {
        id: budgetId,
        is_delete: false,
      },
      attributes: [
        "id",
        "budget_name",
        "total_amount",
        "start_date",
        "end_date",
      ],
      include: [
        {
          model: BudgetCategory,
          as: "budget_categories",
          attributes: ["id", "category_id", "amount"],
          include: [
            {
              model: Category,
              as: "category",
              attributes: ["name"],
            },
          ],
        },
      ],
    });

    if (!budget) {
      res.status(404).json({ status: "error", message: "Budget not found" });
      return;
    }

    res
      .status(200)
      .json({ status: "success", message: "Budget retrieved", data: budget });
  } catch (error: any) {
    console.error("Error fetching budget:", error);
    res.status(500).json({ status: "error", message: "Internal server error" });
  }
};

export const updateBudget = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { budgetId } = req.params;
    const {
      user_id,
      budget_name,
      categories,
      start_date,
      end_date,
      is_delete,
    } = req.body;

    if (!budgetId || !user_id) {
      res.status(400).json({
        status: "error",
        message: "budgetId and user_id are required",
      });
      return;
    }

    await sequelize.transaction(async (t) => {
      const budget = await Budget.findOne({
        where: { id: budgetId, user_id },
        transaction: t,
      });
      if (!budget) {
        throw new Error("Budget not found or user not authorized");
      }

      const updates: any = {};
      if (budget_name) updates.budget_name = budget_name;
      if (start_date) updates.start_date = start_date;
      if (end_date) updates.end_date = end_date;
      if (typeof is_delete === "boolean") updates.is_delete = is_delete;

      if (Object.keys(updates).length) {
        await Budget.update(updates, {
          where: { id: budgetId },
          transaction: t,
        });
      }

      if (categories && Array.isArray(categories)) {
        const totalAmount = categories.reduce(
          (sum, cat) => sum + Number(cat.amount),
          0
        );
        if (totalAmount <= 0)
          throw new Error("Total amount must be greater than zero");

        await BudgetCategory.destroy({
          where: { budget_id: budgetId },
          transaction: t,
        });
        await BudgetCategory.bulkCreate(
          categories.map((cat) => ({
            budget_id: budgetId,
            category_id: cat.category_id,
            amount: cat.amount,
          })),
          { transaction: t }
        );
        await Budget.update(
          { total_amount: totalAmount },
          { where: { id: budgetId }, transaction: t }
        );
      }

      res.status(200).json({ status: "success", message: "Budget updated" });
    });
  } catch (error: any) {
    console.error("Error updating budget:", error);
    res.status(500).json({
      status: "error",
      message: error.message || "Internal server error",
    });
  }
};

export const createBudget = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { user_id, budget_name, categories, start_date, end_date } = req.body;

    if (!user_id || !budget_name || !categories || !start_date || !end_date) {
      res.status(400).json({
        status: "error",
        message:
          "user_id, budget_name, categories, start_date, and end_date are required",
      });
      return;
    }

    if (new Date(start_date) >= new Date(end_date)) {
      res.status(400).json({
        status: "error",
        message: "End date must be after start date",
      });
      return;
    }

    if (!Array.isArray(categories) || categories.length === 0) {
      res.status(400).json({
        status: "error",
        message: "categories must be a non-empty array",
      });
      return;
    }

    const totalAmount = categories.reduce(
      (sum, cat) => sum + Number(cat.amount),
      0
    );
    if (totalAmount <= 0) {
      res.status(400).json({
        status: "error",
        message: "Total amount must be greater than zero",
      });
      return;
    }

    const budget = await Budget.create({
      user_id,
      budget_name,
      total_amount: totalAmount,
      start_date,
      end_date,
      status: "active",
      is_delete: false,
    });

    await BudgetCategory.bulkCreate(
      categories.map((cat) => ({
        budget_id: budget.id,
        category_id: cat.category_id,
        amount: cat.amount,
      }))
    );

    res
      .status(201)
      .json({ status: "success", message: "Budget created", data: budget });
  } catch (error: any) {
    console.error("Error creating budget:", error);
    res.status(500).json({ status: "error", message: "Internal server error" });
  }
};
