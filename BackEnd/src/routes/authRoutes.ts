import { Router } from "express";
import {
  signup,
  verifyEmail,
  login,
  verifyLoginOTP,
  requestToggle2FA,
  verifyToggle2FA,
  requestPasswordReset,
  resetPassword,
} from "../controllers/authController";

const router = Router();

router.post("/signup", signup);
router.post("/verify-email", verifyEmail);
router.post("/login", login);
router.post("/verify-Login-OTP", verifyLoginOTP);
router.post("/request-2FA", requestToggle2FA);
router.post("/verify-2FA-OTP", verifyToggle2FA);
router.post("/request-password-reset", requestPasswordReset);
router.post("/reset-password", resetPassword);

export default router; // ✅ Make sure you're exporting the router
