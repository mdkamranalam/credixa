import express from "express";
import cors from "cors";
import pg from "pg";
import dotenv from "dotenv";

import pool from "./utils/db.js";
import authRoutes from "./routes/auth.routes.js";
import loanRoutes from "./routes/loan.routes.js";
import transactionRoutes from "./routes/transaction.routes.js";
import institutionRoutes from "./routes/institution.routes.js";
import userRoutes from "./routes/user.routes.js";
import adminRoutes from "./routes/admin.routes.js";
import { authenticateToken, requireRole } from "./middleware/auth.middleware.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:5173",
  credentials: true
}));
app.use('/uploads', express.static('uploads'));


// Test the DB Connection on Startup
pool.connect((err, client, release) => {
  if (err) {
    console.error("Error aquiring client: ", err.stack);
  } else {
    console.log("Successfully connected to PostgreSQL database");
  }

  if (client) release();
});

// Validate required environment variables
if (!process.env.JWT_SECRET) {
  console.error("ERROR: JWT_SECRET environment variable is not set. Exiting.");
  process.exit(1);
}

if (!process.env.DB_PASSWORD) {
  console.error("ERROR: DB_PASSWORD environment variable is not set. Exiting.");
  process.exit(1);
}

if (!process.env.ENCRYPTION_KEY) {
  console.error("ERROR: ENCRYPTION_KEY environment variable is not set. Exiting.");
  process.exit(1);
}

// Basic Health Check Route
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "API Gateway is online",
    db_connected: true,
    timestamp: new Date().toISOString(),
    service: "backend-gateway"
  });
});

// Database Health Check Route
app.get("/health/db", async (req, res) => {
  try {
    const client = await pool.connect();
    await client.query('SELECT 1');
    client.release();
    res.status(200).json({
      status: "OK",
      timestamp: new Date().toISOString(),
      database: "connected"
    });
  } catch (error) {
    console.error("Database health check failed:", error);
    res.status(500).json({
      status: "ERROR",
      timestamp: new Date().toISOString(),
      database: "disconnected",
      error: error.message
    });
  }
});

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/institutions", institutionRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/users", authenticateToken, userRoutes);
app.use("/api/loans", authenticateToken, loanRoutes);
app.use("/api/transactions", authenticateToken, requireRole("INSTITUTION_ADMIN"), transactionRoutes);

app.listen(PORT, () => {
  console.log(`API Gateway is running on http://localhost:${PORT}`);
});
