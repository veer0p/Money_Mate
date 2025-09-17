import { Request, Response } from "express";
import { Op, Sequelize } from "sequelize";
import Category from "../models/categoryModel";

export const createCategory = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { name, description, categories } = req.body;

    if (categories && Array.isArray(categories)) {
      // Bulk insertion
      const categoryData = categories.map(
        (cat: { name: string; description?: string }) => ({
          name: cat.name,
          description: cat.description || null,
        })
      );
      const createdCategories = await Category.bulkCreate(categoryData, {
        ignoreDuplicates: true,
      });
      res.status(201).json({
        status: "success",
        message: "Categories created successfully",
        data: createdCategories,
      });
    } else if (name) {
      // Single insertion
      const category = await Category.create({
        name,
        description: description || null,
      });
      res.status(201).json({
        status: "success",
        message: "Category created successfully",
        data: category,
      });
    } else {
      res.status(400).json({
        status: "error",
        message: "name or categories array is required",
      });
      return;
    }
  } catch (error: any) {
    console.error("Error creating category:", error);
    res.status(500).json({
      status: "error",
      message: "Internal server error",
    });
  }
};

export const getCategories = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const categories = await Category.findAll({
      attributes: ["id", "name", "description", "created_at"],
    });

    res.status(200).json({
      status: "success",
      message: "Categories retrieved successfully",
      data: categories,
    });
  } catch (error: any) {
    console.error("Error fetching categories:", error);
    res.status(500).json({
      status: "error",
      message: "Internal server error",
    });
  }
};
