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
      onDelete: "CASCADE", // This ensures messages get deleted when the user is deleted
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
  },
  {
    sequelize,
    modelName: "Message",
  }
);

// Establish association
User.hasMany(Message, { foreignKey: "user_id" });
Message.belongsTo(User, { foreignKey: "user_id" });

export { Message };
