import { DataTypes, Model } from "sequelize";
import { sequelize } from "../config/db";
import User from "./userModel";

class Transaction extends Model {
  public id!: string;
  public user_id!: string;
  public account_number!: string;
  public transaction_type!: "credit" | "debit";
  public category?: string;
  public amount!: number;
  public currency!: string;
  public transaction_date!: Date;
  public description?: string;
  public reference_id?: string;
  public created_at!: Date;
  public updated_at!: Date;
}

// Define Sequelize Model
Transaction.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: User,
        key: "id",
      },
      onDelete: "CASCADE",
    },
    account_number: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    transaction_type: {
      type: DataTypes.ENUM("credit", "debit"),
      allowNull: false,
    },
    category: {
      type: DataTypes.STRING(50),
      allowNull: true, // Will be auto-categorized using AI/ML
    },
    amount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
    },
    currency: {
      type: DataTypes.STRING(3),
      allowNull: false,
      defaultValue: "INR", // Default to Indian Rupees
    },
    transaction_date: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    reference_id: {
      type: DataTypes.STRING(100),
      allowNull: true,
      unique: true, // To prevent duplicate entries
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: "transactions",
    createdAt: "created_at",
    updatedAt: "updated_at",
  }
);

// Define relationship
Transaction.belongsTo(User, { foreignKey: "user_id", as: "user" });

export default Transaction;
