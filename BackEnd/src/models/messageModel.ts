import { DataTypes, Model } from "sequelize";
import { sequelize } from "../config/db";
import User from "./userModel"; // Import User model

class Message extends Model {}

Message.init(
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
      onDelete: "CASCADE", // Ensures messages get deleted when the user is deleted
    },
    sender: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    message_body: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM("received", "sent"),
      defaultValue: "received",
    },
    received_at: {
      type: DataTypes.DATE,
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: "Message",
    indexes: [
      {
        unique: true, // Add a unique constraint
        fields: ["user_id", "sender", "message_body"], // Composite unique key
        name: "unique_message", // Optional: Name the constraint
      },
    ],
  }
);

// Establish association
User.hasMany(Message, { foreignKey: "user_id" });
Message.belongsTo(User, { foreignKey: "user_id" });

export { Message };
