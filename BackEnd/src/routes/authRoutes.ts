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
router.post("/verify-login-otp", verifyLoginOTP);
router.post("/request-toggle-2fa", requestToggle2FA);
router.post("/verify-toggle-2fa", verifyToggle2FA);
router.post("/request-password-reset", requestPasswordReset);
router.post("/reset-password", resetPassword);

export default router;
