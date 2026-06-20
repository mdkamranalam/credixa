import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import logger from "../utils/logger.js";
import redisClient from "../utils/redis.js";

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET;

export const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    logger.warn(`Authentication failed: No token provided for ${req.path}`);
    return res.status(401).json({ error: "Access Denied. No token provided." });
  }

  try {
    const verifiedUser = jwt.verify(token, JWT_SECRET);
    
    // Check if token is blacklisted in Redis
    if (verifiedUser.jti && redisClient.isReady) {
      const isBlacklisted = await redisClient.get(`bl_${verifiedUser.jti}`);
      if (isBlacklisted) {
        logger.warn(`Authentication failed: Token blacklisted for ${req.path}`);
        return res.status(401).json({ error: "Token has been revoked. Please log in again." });
      }
    }

    req.user = verifiedUser;
    logger.info(`User authenticated successfully: ${verifiedUser.user_id || verifiedUser.id}`);
    next();
  } catch (error) {
    logger.warn(`Authentication failed: Invalid or expired token for ${req.path}`);
    // Don't expose specific error details to client
    return res.status(401).json({ error: "Invalid or expired token." });
  }
};

// Role based access control middleware
export const requireRole = (role) => {
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      logger.warn(`Role access denied: No user role for ${req.path}`);
      return res.status(403).json({ error: "Unauthorized access." });
    }

    const allowedRoles = Array.isArray(role) ? role : [role];
    if (!allowedRoles.includes(req.user.role)) {
      logger.warn(`Role access denied: User ${req.user.user_id} tried to access ${req.path} with role ${req.user.role}`);
      return res
        .status(403)
        .json({ error: "Unauthorized role for this access." });
    }
    next();
  };
};

// Enhanced authentication middleware with additional security checks
export const enhancedAuthenticateToken = async (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    logger.warn(`Enhanced authentication failed: No token provided for ${req.path}`);
    return res.status(401).json({ error: "Access Denied. No token provided." });
  }

  try {
    const verifiedUser = jwt.verify(token, JWT_SECRET);

    // Check if token is blacklisted in Redis
    if (verifiedUser.jti && redisClient.isReady) {
      const isBlacklisted = await redisClient.get(`bl_${verifiedUser.jti}`);
      if (isBlacklisted) {
        logger.warn(`Enhanced authentication failed: Token blacklisted for ${req.path}`);
        return res.status(401).json({ error: "Token has been revoked." });
      }
    }

    // Additional security checks
    if (!verifiedUser || (!verifiedUser.id && !verifiedUser.user_id) || !verifiedUser.role) {
      logger.warn(`Enhanced authentication failed: Invalid token structure for ${req.path}`);
      return res.status(403).json({ error: "Invalid token structure." });
    }

    req.user = verifiedUser;
    logger.info(`Enhanced authentication successful for user: ${verifiedUser.id || verifiedUser.user_id}`);
    next();
  } catch (error) {
    logger.warn(`Enhanced authentication failed: Invalid or expired token for ${req.path}`);
    return res.status(401).json({ error: "Invalid or expired token." });
  }
};
