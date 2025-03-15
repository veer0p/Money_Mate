import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { Op } from "sequelize";
import User from "../models/userModel";
import sendEmail from "../utils/sendEmail";
import { generateOTP, verifyOTP } from "../utils/otpUtils";
import { generateToken, generateRefreshToken } from "../utils/jwtUtils";
import { promises } from "dns";
import { v4 as uuidv4 } from "uuid";

const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret";

/**
 * @desc Register a new user
 * @route POST /api/auth/signup
 */
export const signup = async (req: Request, res: Response): Promise<void> => {
  try {
    const { first_name, last_name, email, password, phone_number } = req.body;

    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      res.status(400).json({ message: "Email already in use" });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const emailOTP = generateOTP();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000);

    await User.create({
      id: uuidv4(), // Generate UUID manually
      first_name,
      last_name,
      email,
      phone_number,
      password: hashedPassword,
      email_verification_otp: emailOTP,
      otp_expires_at: otpExpires,
      is_verified: false,
    });

    await sendEmail(email, "Verify Your Email", `Your OTP: ${emailOTP}`);

    res
      .status(201)
      .json({ message: "User registered. Verify your email with OTP." });
  } catch (error: unknown) {
    const err = error as Error;
    res
      .status(500)
      .json({ message: "User registration failed", error: err.message });
  }
};

/**
 * @desc Verify Email OTP
 * @route POST /api/auth/verify-email
 */
export const verifyEmail = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { email, otp } = req.body;
    const user = await User.findOne({ where: { email } });

    if (!user || !user.email_verification_otp) {
      res.status(400).json({ message: "Invalid OTP or user not found" });
      return;
    }

    if (
      !verifyOTP(user.email_verification_otp, otp) ||
      new Date() > user.otp_expires_at!
    ) {
      res.status(400).json({ message: "Invalid or expired OTP" });
      return;
    }

    await user.update({
      is_email_verified: true,
      is_verified: true,
      email_verification_otp: null,
    });

    res.json({ message: "Email verified successfully. You can now log in." });
  } catch (error: unknown) {
    const err = error as Error;
    res
      .status(500)
      .json({ message: "Email verification failed", error: err.message });
  }
};

/**
 * @desc Login user
 * @route POST /api/auth/login
 */
export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ where: { email } });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      res.status(401).json({ message: "Invalid email or password" });
      return;
    }

    if (!user.is_verified) {
      res.status(403).json({ message: "Please verify your email" });
      return;
    }

    // If 2FA is enabled, send OTP instead of logging in
    if (user.is_2fa_enabled) {
      const otp = generateOTP();
      const otpExpires = new Date(Date.now() + 10 * 60 * 1000);

      await user.update({ otp, otp_expires_at: otpExpires });
      await sendEmail(email, "Your Login OTP", `Your OTP: ${otp}`);

      res.json({ message: "OTP sent to email. Please verify to continue." });
      return;
    }

    // Normal login flow (without 2FA)
    const token = generateToken(user.id, user.role ?? "user");
    const refreshToken = generateRefreshToken(user.id);

    res.json({
      message: "Login successful",
      userId: user.id, // Include user ID in the response
      token,
      refreshToken,
    });
  } catch (error) {
    res.status(500).json({ message: "Login failed", error });
  }
};

export const verifyLoginOTP = async (req: Request, res: Response) => {
  try {
    const { email, otp } = req.body;
    const user = await User.findOne({ where: { email } });

    if (
      !user ||
      !user.otp ||
      !user.otp_expires_at ||
      new Date() > user.otp_expires_at
    ) {
      res.status(400).json({ message: "Invalid or expired OTP" });
      return;
    }

    if (user.otp !== otp) {
      res.status(400).json({ message: "Incorrect OTP" });
      return;
    }

    // Generate JWT token
    const token = generateToken(user.id, user.role ?? "user");
    const refreshToken = generateRefreshToken(user.id);

    await user.update({ otp: null, otp_expires_at: null });

    res.json({ message: "Login successful", token, refreshToken });
  } catch (error) {
    res.status(500).json({ message: "OTP verification failed", error });
  }
};

/**
 * @desc Request OTP to toggle 2FA (enable/disable)
 * @route POST /api/auth/request-toggle-2fa
 */
export const requestToggle2FA = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ where: { email } });

    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    const otp = generateOTP();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000);
    const action = user.is_2fa_enabled ? "Disable" : "Enable";

    await user.update({ otp, otp_expires_at: otpExpires });

    await sendEmail(email, `${action} 2FA OTP`, `Your OTP: ${otp}`);

    res.json({
      message: `OTP sent. Please verify to ${action.toLowerCase()} 2FA.`,
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to send OTP", error });
  }
};

/**
 * @desc Verify OTP and toggle 2FA status
 * @route POST /api/auth/verify-toggle-2fa
 */
export const verifyToggle2FA = async (req: Request, res: Response) => {
  try {
    const { email, otp } = req.body;
    const user = await User.findOne({ where: { email } });

    if (
      !user ||
      !user.otp ||
      !user.otp_expires_at ||
      new Date() > user.otp_expires_at
    ) {
      res.status(400).json({ message: "Invalid or expired OTP" });
      return;
    }

    if (user.otp !== otp) {
      res.status(400).json({ message: "Incorrect OTP" });
      return;
    }

    const newStatus = !user.is_2fa_enabled; // Toggle 2FA status
    await user.update({
      is_2fa_enabled: newStatus,
      otp: null,
      otp_expires_at: null,
    });

    res.json({
      message: `2FA ${newStatus ? "enabled" : "disabled"} successfully.`,
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to toggle 2FA", error });
  }
};

/**
 * @desc Request Password Reset
 * @route POST /api/auth/request-password-reset
 */
export const requestPasswordReset = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ where: { email } });

    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetTokenExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    await user.update({
      password_reset_token: resetToken,
      password_reset_expires: resetTokenExpires,
    });

    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
    await sendEmail(
      email,
      "Password Reset Request",
      `Reset your password here: ${resetUrl}`
    );

    res.json({ message: "Password reset link sent to email" });
  } catch (error: unknown) {
    const err = error as Error;
    res
      .status(500)
      .json({ message: "Password reset request failed", error: err.message });
  }
};

/**
 * @desc Reset Password
 * @route POST /api/auth/reset-password
 */ export const resetPassword = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { token, newPassword } = req.body;
    const user = await User.findOne({
      where: { password_reset_token: token },
    });

    if (!user || new Date() > user.password_reset_expires!) {
      res.status(400).json({ message: "Invalid or expired token" });
      return;
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await user.update({
      password: hashedPassword,
      password_reset_token: null,
    });

    res.json({ message: "Password reset successful. You can log in now." });
  } catch (error: unknown) {
    const err = error as Error;
    res
      .status(500)
      .json({ message: "Password reset failed", error: err.message });
  }
};
