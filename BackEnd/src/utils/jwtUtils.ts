import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret";
const JWT_REFRESH_SECRET =
  process.env.JWT_REFRESH_SECRET || "your_refresh_secret";

/**
 * Generate an access token (valid for 1 hour)
 */
export const generateToken = (userId: string, role: string) => {
  return jwt.sign({ userId, role }, JWT_SECRET, { expiresIn: "1h" });
};

/**
 * Generate a refresh token (valid for 7 days)
 */
export const generateRefreshToken = (userId: string) => {
  return jwt.sign({ userId }, JWT_REFRESH_SECRET, { expiresIn: "7d" });
};

/**
 * Verify access token
 */
export const verifyToken = (token: string) => {
  return jwt.verify(token, JWT_SECRET);
};
