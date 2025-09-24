import { DataTypes, Model } from "sequelize";
import { sequelize } from "../config/db";
import User from "./userModel";

class FinancialInsight extends Model {
  public id!: string;
  public insight_type!: string;
  public date_or_month!: string | null;
  public account_number!: string | null;
  public category!: string | null;
  public amount!: number | null;
  public income!: number | null;
  public expense!: number | null;
  public balance!: number | null;
  public notes!: string | null;
  public data_value!: object | null;
  public generated_at!: Date;
  public user_id!: string;

  // Declare associations
  public readonly user?: User;
}

FinancialInsight.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    insight_type: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    date_or_month: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    account_number: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    category: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    amount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: true,
    },
    income: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: true,
    },
    expense: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: true,
    },
    balance: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: true,
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    data_value: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
    generated_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
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
  },
  {
    sequelize,
    tableName: "financial_insights",
    timestamps: true,
    createdAt: 'generated_at',
    updatedAt: false,
    indexes: [
      {
        fields: ["user_id"],
      },
      {
        fields: ["insight_type"],
      },
      {
        fields: ["date_or_month"],
      },
    ],
  }
);

// Establish associations
FinancialInsight.belongsTo(User, { foreignKey: "user_id", as: "user" });
User.hasMany(FinancialInsight, {
  foreignKey: "user_id",
  as: "financial_insights",
});

export default FinancialInsight;
