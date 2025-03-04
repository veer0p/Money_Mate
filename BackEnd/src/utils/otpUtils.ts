import crypto from "crypto";

/**
 * Generate a 6-digit OTP
 */
export const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * Verify if the OTP is correct
 */
export const verifyOTP = (storedOTP: string, inputOTP: string) => {
  return storedOTP === inputOTP;
};
