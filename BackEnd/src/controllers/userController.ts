import { Request, Response } from "express";
import User from "../models/userModel";
import Transaction from "../models/transactionsModel";
import path from "path";
import fs from "fs";
import { Op } from "sequelize";

const extractBalanceFromMessage = (messageBody: string): number | null => {
  const balancePatterns = [
    /avlbl amt:rs\.?(\d+(?:,\d+)*(?:\.\d{2})?)/i,
    /avl bal:rs\.?(\d+(?:,\d+)*(?:\.\d{2})?)/i,
    /total bal:rs\.?(\d+(?:,\d+)*(?:\.\d{2})?)/i,
    /balance:rs\.?(\d+(?:,\d+)*(?:\.\d{2})?)/i,
    /avlbal:\s*rs\.?(\d+(?:,\d+)*(?:\.\d{2})?)/i,
  ];
  
  for (const pattern of balancePatterns) {
    const match = messageBody.match(pattern);
    if (match) {
      return parseFloat(match[1].replace(/,/g, ''));
    }
  }
  
  return null;
};

export const getUserDetails = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;

    if (!userId) {
      res.status(400).json({ message: "User ID is required." });
      return;
    }

    const user = await User.findByPk(userId);

    if (!user) {
      res.status(404).json({ message: "User not found." });
      return;
    }

    let currentBalance = user.getDataValue("account_balance");
    let balanceUpdated = false;

    console.log(`Current balance for user ${userId}:`, currentBalance);

    // Check if balance needs to be found or updated
    if (!currentBalance || currentBalance === 0) {
      // No balance - find from latest transaction with balance info
      const latestTransactionWithBalance = await Transaction.findOne({
        where: {
          user_id: userId,
          description: {
            [Op.or]: [
              { [Op.iLike]: '%avlbl amt%' },
              { [Op.iLike]: '%avl bal%' },
              { [Op.iLike]: '%total bal%' },
              { [Op.iLike]: '%balance%' },
              { [Op.iLike]: '%avlbal%' }
            ]
          }
        },
        order: [['transaction_date', 'DESC']]
      });

      if (latestTransactionWithBalance) {
        console.log('Found transaction with balance:', latestTransactionWithBalance.getDataValue('description').substring(0, 100));
        const extractedBalance = extractBalanceFromMessage(latestTransactionWithBalance.getDataValue('description'));
        console.log('Extracted balance:', extractedBalance);
        if (extractedBalance) {
          currentBalance = extractedBalance;
          await User.update({ account_balance: currentBalance }, { where: { id: userId } });
          balanceUpdated = true;
          console.log('Balance updated to:', currentBalance);
        }
      } else {
        console.log('No transaction with balance found');
      }
    } else {
      // Balance exists - check if latest transaction has different balance
      const latestTransactionWithBalance = await Transaction.findOne({
        where: {
          user_id: userId,
          description: {
            [Op.or]: [
              { [Op.iLike]: '%avlbl amt%' },
              { [Op.iLike]: '%avl bal%' },
              { [Op.iLike]: '%total bal%' },
              { [Op.iLike]: '%balance%' },
              { [Op.iLike]: '%avlbal%' }
            ]
          }
        },
        order: [['transaction_date', 'DESC']]
      });

      if (latestTransactionWithBalance) {
        const extractedBalance = extractBalanceFromMessage(latestTransactionWithBalance.getDataValue('description'));
        if (extractedBalance && Math.abs(extractedBalance - currentBalance) > 0.01) {
          // Balance is different - update it
          currentBalance = extractedBalance;
          await User.update({ account_balance: currentBalance }, { where: { id: userId } });
          balanceUpdated = true;
        }
      }
    }

    res.status(200).json({
      message: "User details retrieved successfully.",
      user: {
        id: user.getDataValue("id"),
        first_name: user.getDataValue("first_name"),
        last_name: user.getDataValue("last_name"),
        name: `${user.getDataValue("first_name")} ${user.getDataValue("last_name")}`,
        email: user.getDataValue("email"),
        phone: user.getDataValue("phone_number"),
        phone_number: user.getDataValue("phone_number"),
        dob: user.getDataValue("dob"),
        balance: currentBalance,
        account_balance: currentBalance,
        profile_image: user.getDataValue("profile_image_url"),
        profile_image_url: user.getDataValue("profile_image_url"),
        is_active: user.getDataValue("is_active"),
        is_verified: user.getDataValue("is_verified"),
        is_email_verified: user.getDataValue("is_email_verified"),
        role: user.getDataValue("role"),
        is_2fa_enabled: user.getDataValue("is_2fa_enabled"),
        last_login: user.getDataValue("last_login"),
        created_at: user.getDataValue("created_at"),
        updated_at: user.getDataValue("updated_at"),
      },
      balanceUpdated: balanceUpdated
    });
  } catch (error) {
    console.error("Error retrieving user details:", error);
    res.status(500).json({ message: "Failed to retrieve user details.", error });
  }
};

export const updateUserDetails = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;
    const { first_name, last_name, name, email, phone, phone_number, dob, profile_image_url } = req.body;

    if (!userId) {
      res.status(400).json({ message: "User ID is required." });
      return;
    }

    const user = await User.findByPk(userId);

    if (!user) {
      res.status(404).json({ message: "User not found." });
      return;
    }

    const updateData: any = {};
    if (first_name) updateData.first_name = first_name;
    if (last_name) updateData.last_name = last_name;
    if (email) updateData.email = email;
    if (phone_number || phone) updateData.phone_number = phone_number || phone;
    if (dob) updateData.dob = dob;
    if (profile_image_url) updateData.profile_image_url = profile_image_url;

    await User.update(updateData, { where: { id: userId } });

    const updatedUser = await User.findByPk(userId);

    res.status(200).json({
      message: "User details updated successfully.",
      user: {
        id: updatedUser?.getDataValue("id"),
        first_name: updatedUser?.getDataValue("first_name"),
        last_name: updatedUser?.getDataValue("last_name"),
        name: `${updatedUser?.getDataValue("first_name")} ${updatedUser?.getDataValue("last_name")}`,
        email: updatedUser?.getDataValue("email"),
        phone: updatedUser?.getDataValue("phone_number"),
        phone_number: updatedUser?.getDataValue("phone_number"),
        dob: updatedUser?.getDataValue("dob"),
        balance: updatedUser?.getDataValue("account_balance"),
        account_balance: updatedUser?.getDataValue("account_balance"),
        profile_image: updatedUser?.getDataValue("profile_image_url"),
        profile_image_url: updatedUser?.getDataValue("profile_image_url"),
        is_active: updatedUser?.getDataValue("is_active"),
        is_verified: updatedUser?.getDataValue("is_verified"),
        is_email_verified: updatedUser?.getDataValue("is_email_verified"),
        role: updatedUser?.getDataValue("role"),
        is_2fa_enabled: updatedUser?.getDataValue("is_2fa_enabled"),
        last_login: updatedUser?.getDataValue("last_login"),
        created_at: updatedUser?.getDataValue("created_at"),
        updated_at: updatedUser?.getDataValue("updated_at"),
      },
    });
  } catch (error) {
    console.error("Error updating user details:", error);
    res.status(500).json({ message: "Failed to update user details.", error });
  }
};

export const uploadProfileImage = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;
    const file = req.file;

    if (!userId) {
      res.status(400).json({ message: "User ID is required." });
      return;
    }

    if (!file) {
      res.status(400).json({ message: "Profile image is required." });
      return;
    }

    const user = await User.findByPk(userId);

    if (!user) {
      res.status(404).json({ message: "User not found." });
      return;
    }

    const uploadsDir = path.join(__dirname, "../../uploads");
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const fileName = `${userId}_${Date.now()}_${file.originalname}`;
    const filePath = path.join(uploadsDir, fileName);

    fs.writeFileSync(filePath, file.buffer);

    const profileImageUrl = `/uploads/${fileName}`;

    await User.update(
      { profile_image_url: profileImageUrl },
      { where: { id: userId } }
    );

    res.status(200).json({
      message: "Profile image uploaded successfully.",
      data: {
        profile_image_url: profileImageUrl
      },
      profile_image: profileImageUrl,
    });
  } catch (error) {
    console.error("Error uploading profile image:", error);
    res.status(500).json({ message: "Failed to upload profile image.", error });
  }
};

export const updateUserBalance = async (req: Request, res: Response): Promise<void> => {
  try {
    const { user_id, balance } = req.body;
    
    if (!user_id || balance === undefined) {
      res.status(400).json({ error: "user_id and balance are required" });
      return;
    }
    
    await User.update(
      { account_balance: balance },
      { where: { id: user_id } }
    );
    
    res.json({ 
      success: true,
      message: "Balance updated successfully",
      balance: balance
    });
  } catch (error) {
    console.error("Error updating balance:", error);
    res.status(500).json({ error: "Failed to update balance" });
  }
};