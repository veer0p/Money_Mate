import { DataTypes, Model } from "sequelize";
import { sequelize } from "../config/db";
import User from "./userModel";

class Budget extends Model {
  public id!: string;
  public user_id!: string;
  public budget_name!: string;
  public total_amount!: number;
  public start_date!: Date;
  public end_date!: Date;
  public reminder_date?: Date;
  public email_sent!: boolean;
  public status!: "active" | "expired" | "inactive";
  public is_delete!: boolean;
  public created_at!: Date;
  public updated_at!: Date;
}

Budget.init(
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
    budget_name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
    total_amount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      validate: {
        min: 0,
      },
    },
    start_date: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    end_date: {
      type: DataTypes.DATE,
      allowNull: false,
      validate: {
        isAfterStartDate(this: Budget, value: Date) {
          if (value <= this.start_date) {
            throw new Error("End date must be after start date");
          }
        },
      },
    },
    reminder_date: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    email_sent: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    status: {
      type: DataTypes.ENUM("active", "expired", "inactive"),
      defaultValue: "active",
      allowNull: false,
    },
    is_delete: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false,
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
    tableName: "budgets",
    createdAt: "created_at",
    updatedAt: "updated_at",
    indexes: [
      {
        fields: ["user_id"],
      },
      {
        fields: ["status"],
      },
      {
        fields: ["start_date", "end_date"],
      },
    ],
  }
);

// Establish associations
Budget.belongsTo(User, { foreignKey: "user_id", as: "user" });
User.hasMany(Budget, { foreignKey: "user_id", as: "budgets" });

export default Budget;
