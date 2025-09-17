import { DataTypes, Model } from "sequelize";
import { sequelize } from "../config/db";
import User from "./userModel";

class SavingGoal extends Model {
  public id!: string;
  public user_id!: string;
  public title!: string;
  public description!: string;
  public goal_amount!: number;
  public saved_amount!: number;
  public status!: "upcoming" | "in_progress" | "archived" | "failed";
  public start_date!: Date;
  public end_date!: Date;
  public is_delete!: boolean;
  public created_at!: Date;
  public updated_at!: Date;
}

// Define Sequelize Model
SavingGoal.init(
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
    },
    title: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    goal_amount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
    },
    saved_amount: {
      type: DataTypes.DECIMAL(12, 2),
      defaultValue: 0.0,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM("upcoming", "in_progress", "archived", "failed"),
      defaultValue: "upcoming",
      allowNull: false,
    },
    start_date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    end_date: {
      type: DataTypes.DATEONLY,
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
    },
  },
  {
    sequelize,
    tableName: "saving_goals",
    createdAt: "created_at",
    updatedAt: "updated_at",
    indexes: [
      {
        fields: ["user_id"],
      },
      {
        fields: ["status"],
      },
    ],
  }
);

// Define associations
SavingGoal.belongsTo(User, {
  foreignKey: "user_id",
  as: "user",
});

User.hasMany(SavingGoal, {
  foreignKey: "user_id",
  as: "saving_goals",
});

export default SavingGoal;
