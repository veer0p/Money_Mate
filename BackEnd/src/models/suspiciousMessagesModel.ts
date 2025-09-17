import { DataTypes, Model } from "sequelize";
import { sequelize } from "../config/db";
import User from "./userModel";
import Message from "./messageModel";

class SuspiciousMessage extends Model {
  public id!: string;
  public message_id!: string;
  public reason!: string;
  public flagged_at!: Date;
  public created_at!: Date;
  public updated_at!: Date;
}

SuspiciousMessage.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    message_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: Message,
        key: "id",
      },
      onDelete: "CASCADE",
    },
    reason: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    flagged_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
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
    tableName: "suspicious_messages",
    createdAt: "created_at",
    updatedAt: "updated_at",
    indexes: [
      {
        unique: true,
        fields: ["message_id"],
      },
    ],
  }
);

// Establish associations
SuspiciousMessage.belongsTo(Message, { foreignKey: "message_id", as: "message" });
Message.hasOne(SuspiciousMessage, { foreignKey: "message_id", as: "suspicious_flag" });

export default SuspiciousMessage;
