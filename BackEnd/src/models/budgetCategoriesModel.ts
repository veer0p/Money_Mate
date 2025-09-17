import { DataTypes, Model } from "sequelize";
import { sequelize } from "../config/db";
import Budget from "./budgetModel";
import Category from "./categoryModel";

class BudgetCategory extends Model {
  public id!: string;
  public budget_id!: string;
  public category_id!: string;
  public amount!: number;
  public spent_amount!: number;
  public created_at!: Date;
  public updated_at!: Date;
}

BudgetCategory.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    budget_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: Budget,
        key: "id",
      },
      onDelete: "CASCADE",
    },
    category_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: Category,
        key: "id",
      },
      onDelete: "CASCADE",
    },
    amount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      validate: {
        min: 0,
      },
    },
    spent_amount: {
      type: DataTypes.DECIMAL(12, 2),
      defaultValue: 0.0,
      allowNull: false,
      validate: {
        min: 0,
      },
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    tableName: "budget_categories",
    createdAt: "created_at",
    updatedAt: "updated_at",
    indexes: [
      {
        unique: true,
        fields: ["budget_id", "category_id"],
      },
    ],
  }
);

// Establish associations
BudgetCategory.belongsTo(Budget, { foreignKey: "budget_id", as: "budget" });
BudgetCategory.belongsTo(Category, { foreignKey: "category_id", as: "category" });

Budget.hasMany(BudgetCategory, { foreignKey: "budget_id", as: "budget_categories" });
Category.hasMany(BudgetCategory, { foreignKey: "category_id", as: "budget_categories" });

export default BudgetCategory;
