import { Request, Response } from "express";
import { Op } from "sequelize";
import SavingGoal from "../models/savingGoalsModel";
import User from "../models/userModel";

export const getSavingGoals = async (
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

    const goals = await SavingGoal.findAll({
      where: {
        user_id: userId,
        is_delete: false,
        ...(search && { title: { [Op.iLike]: `%${search}%` } }),
      },
      attributes: [
        "id",
        "title",
        "goal_amount",
        "saved_amount",
        "status",
        "start_date",
        "end_date",
      ],
      include: [
        {
          model: User,
          as: "user",
          attributes: ["first_name", "last_name"],
        },
      ],
    });

    res.status(200).json({
      status: "success",
      message: "Saving goals retrieved successfully",
      data: goals || [],
    });
  } catch (error: any) {
    console.error("Error fetching saving goals:", error);
    res.status(500).json({
      status: "error",
      message: "Failed to fetch saving goals",
      error: error.message,
    });
  }
};

export const getSavingGoalDetails = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { goalId } = req.params;
    if (!goalId) {
      res.status(400).json({ status: "error", message: "goalId is required" });
      return;
    }

    const goal = await SavingGoal.findOne({
      where: {
        id: goalId,
        is_delete: false,
      },
      attributes: [
        "id",
        "title",
        "description",
        "goal_amount",
        "saved_amount",
        "status",
        "start_date",
        "end_date",
        "created_at",
        "updated_at",
      ],
      include: [
        {
          model: User,
          as: "user",
          attributes: ["first_name", "last_name"],
        },
      ],
    });

    if (!goal) {
      res
        .status(404)
        .json({ status: "error", message: "Saving goal not found" });
      return;
    }

    res.status(200).json({
      status: "success",
      message: "Saving goal retrieved",
      data: goal,
    });
  } catch (error: any) {
    console.error("Error fetching saving goal:", error);
    res.status(500).json({ status: "error", message: "Internal server error" });
  }
};

export const updateSavingGoal = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { goalId } = req.params;
    const {
      user_id,
      title,
      description,
      goal_amount,
      saved_amount,
      status,
      start_date,
      end_date,
      is_delete,
    } = req.body;

    if (!goalId || !user_id) {
      res.status(400).json({
        status: "error",
        message: "goalId and user_id are required",
      });
      return;
    }

    const goal = await SavingGoal.findOne({
      where: { id: goalId, user_id },
    });

    if (!goal) {
      res.status(404).json({
        status: "error",
        message: "Saving goal not found or user not authorized",
      });
      return;
    }

    const updates: any = {};
    if (title) updates.title = title;
    if (description) updates.description = description;
    if (goal_amount) updates.goal_amount = goal_amount;
    if (saved_amount) updates.saved_amount = saved_amount;
    if (status) updates.status = status;
    if (start_date) updates.start_date = start_date;
    if (end_date) updates.end_date = end_date;
    if (typeof is_delete === "boolean") updates.is_delete = is_delete;

    await SavingGoal.update(updates, {
      where: { id: goalId },
    });

    res.status(200).json({ status: "success", message: "Saving goal updated" });
  } catch (error: any) {
    console.error("Error updating saving goal:", error);
    res.status(500).json({ status: "error", message: "Internal server error" });
  }
};

export const createSavingGoal = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { user_id, title, description, goal_amount, start_date, end_date } =
      req.body;

    if (!user_id || !title || !goal_amount || !start_date || !end_date) {
      res.status(400).json({
        status: "error",
        message:
          "user_id, title, goal_amount, start_date, and end_date are required",
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

    const goal = await SavingGoal.create({
      user_id,
      title,
      description,
      goal_amount,
      saved_amount: 0,
      status: "upcoming",
      start_date,
      end_date,
      is_delete: false,
    });

    res
      .status(201)
      .json({ status: "success", message: "Saving goal created", data: goal });
  } catch (error: any) {
    console.error("Error creating saving goal:", error);
    res.status(500).json({ status: "error", message: "Internal server error" });
  }
};
