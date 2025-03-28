import { Router } from "express";
import {
  getUserDetails,
  updateUserDetails,
  uploadProfileImage,
} from "../controllers/userController";
import multer from "multer";

const upload = multer({ storage: multer.memoryStorage() });

const router = Router();

// Route to get user details by userId
router.get("/view/:userId", getUserDetails);

// Route to update user details by userId
router.put("/update/:userId", updateUserDetails);

router.post(
  "/user/:userId/upload-profile-image",
  upload.single("profileImage"),
  uploadProfileImage
);

export default router;
