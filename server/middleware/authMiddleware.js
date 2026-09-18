import jwt from "jsonwebtoken";
import User from "../models/User.js";

/**
 * Ensures JWT_SECRET is configured in the environment.
 * Throws a fatal error if missing to prevent insecure fallback secrets.
 */
export const getJwtSecret = () => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error(
      "FATAL: JWT_SECRET environment variable is not defined. Server cannot process authentication."
    );
  }
  return secret;
};

/**
 * Generates a signed JSON Web Token.
 * @param {string} id - The MongoDB user ID
 * @returns {string} Signed JWT
 */
export const generateToken = (id) => {
  const secret = getJwtSecret();
  const expiresIn = process.env.JWT_EXPIRES_IN || "7d";
  return jwt.sign({ id }, secret, { expiresIn });
};

/**
 * Protect middleware: Verifies Bearer JWT and attaches req.user.
 */
export const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer ")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    return res.status(401).json({ message: "Not authorized, token missing" });
  }

  try {
    const secret = getJwtSecret();
    const decoded = jwt.verify(token, secret);

    const user = await User.findById(decoded.id).select("-password");
    if (!user) {
      return res.status(401).json({ message: "Not authorized, user not found" });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        message: "Not authorized, token expired",
        code: "TOKEN_EXPIRED",
      });
    }

    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({
        message: "Not authorized, token invalid",
      });
    }

    // Pass any other server-level error to next
    next(error);
  }
};
