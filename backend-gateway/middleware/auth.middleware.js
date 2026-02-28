import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

const JWT_SECRET =
  process.env.JWT_SECRET || "super_secret_credixa_key_change_in_production";

export const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "Access Denied. No token provided." });
  }

  try {
    const verifiedUser = jwt.verify(token, JWT_SECRET);
    req.user = verifiedUser;
    next();
  } catch (error) {
    return res.status(403).json({ error: "Invalid or expired token." });
  }
};

// Role based access control middleware
export const requireRole = (role) => {
  return (req, res, next) => {
    if (!role.includes(req.user.role)) {
      return res
        .status(403)
        .json({ error: "Unauthoried role for this access." });
    }
    next();
  };
};
