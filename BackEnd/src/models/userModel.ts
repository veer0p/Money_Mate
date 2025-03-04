import { DataTypes, Model, Op } from "sequelize";
import { sequelize } from "../config/db";

class User extends Model {
  public id!: string;
  public first_name!: string;
  public last_name!: string;
  public dob?: Date;
  public email!: string;
  public phone_number?: string;
  public password!: string;
  public is_deleted!: boolean;
  public is_active!: boolean;
  public is_verified!: boolean;
  public is_email_verified!: boolean;
  public email_verification_otp?: string;
  public created_at!: Date;
  public updated_at!: Date;
  public failed_login_attempts!: number;
  public last_login?: Date;
  public password_reset_token?: string;
  public password_reset_expires?: Date;
  public role!: string; // Changed to string
  public is_2fa_enabled!: boolean;
  public two_factor_secret?: string;
  public otp?: string;
  public otp_expires_at?: Date;
  public google_id?: string;
  public facebook_id?: string;
  public apple_id?: string;
  public profile_image_url?: string;
  public bio?: string;
  public about_me?: string;
}

// Define Sequelize Model
User.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    first_name: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    last_name: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    dob: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
    },
    phone_number: {
      type: DataTypes.STRING(20),
      allowNull: true,
      unique: true,
    },
    password: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    is_deleted: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    is_verified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    is_email_verified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    email_verification_otp: {
      type: DataTypes.STRING(6),
      allowNull: true,
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    failed_login_attempts: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    last_login: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    password_reset_token: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    password_reset_expires: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    role: {
      type: DataTypes.STRING, // Changed to STRING
      defaultValue: "user",
      validate: {
        isIn: [["user", "admin", "moderator"]], // Enforce allowed values
      },
    },
    is_2fa_enabled: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    two_factor_secret: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    otp: {
      type: DataTypes.STRING(6),
      allowNull: true,
    },
    otp_expires_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    google_id: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    facebook_id: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    apple_id: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    profile_image_url: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    bio: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    about_me: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: "users",
    createdAt: "created_at",
    updatedAt: "updated_at",
    indexes: [
      {
        unique: true,
        fields: ["email"],
      },
      {
        unique: true,
        fields: ["phone_number"],
      },
      {
        unique: true,
        fields: ["google_id", "facebook_id", "apple_id"],
        where: {
          [Op.or]: [
            { google_id: { [Op.ne]: null } },
            { facebook_id: { [Op.ne]: null } },
            { apple_id: { [Op.ne]: null } },
          ],
        },
      },
    ],
  }
);

export default User;
