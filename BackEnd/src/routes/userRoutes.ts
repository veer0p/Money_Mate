import express from "express";
import {
  getAllUsers,
  getUserDetails,
  updateUserDetails,
} from "../controllers/userController";
import authMiddleware from "../middleware/authMiddleware";

const router = express.Router();

// Get user details
router.get("/:id", getUserDetails);

// Update user details
router.put("/:id", updateUserDetails);

// Get all active users (Requires authentication)
router.get("/", authMiddleware, getAllUsers);

export default router;
