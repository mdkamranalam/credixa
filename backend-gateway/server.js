import express from "express";
import cors from "cors";
import pg from "pg";
import dotenv from "dotenv";

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
app.use(cors());
app.use('/uploads', express.static('uploads'));

// Establish PostgreSQL Connection Pool
const { Pool } = pg;
const pool = new Pool({
  user: process.env.DB_USER || "credixa_admin",
  host: process.env.DB_HOST || "localhost",
  database: process.env.DB_NAME || "credixa_db",
  password: process.env.DB_PASSWORD || "admin@123",
  port: process.env.DB_PORT || 5432,
});

pool.on('error', (err, client) => {
  console.error('Unexpected error on idle client', err);
});


// Test the DB Connection on Startup
pool.connect((err, client, release) => {
  if (err) {
    console.error("Error aquiring client: ", err.stack);
  } else {
    console.log("Successfully connected to PostgreSQL database");
  }

  if (client) release();
});

// Basic Health Check Route
app.get("/health", (req, res) => {
  res.status(200).json({ status: "API Gateway is online", db_connected: true });
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
