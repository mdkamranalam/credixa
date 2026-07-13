import express from "express";
import cors from "cors";
import pg from "pg";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";

import pool from "./utils/db.js";
import authRoutes from "./routes/auth.routes.js";
import loanRoutes from "./routes/loan.routes.js";
import transactionRoutes from "./routes/transaction.routes.js";
import institutionRoutes from "./routes/institution.routes.js";
import userRoutes from "./routes/user.routes.js";

import adminRoutes from "./routes/admin.routes.js";
import fileRoutes from "./routes/file.routes.js";
import notificationRoutes from "./routes/notification.routes.js";
import sseRoutes from "./routes/sse.routes.js";
import webhookRoutes from "./routes/webhook.routes.js";
import supportRoutes from "./routes/support.routes.js";
import superadminRoutes from "./routes/superadmin.routes.js";
import { startLoanScheduler } from "./jobs/loan_scheduler.js";
import { authenticateToken, requireRole } from "./middleware/auth.middleware.js";
import { initObservability, timingMiddleware } from "./utils/observability.js";

dotenv.config();
initObservability();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(timingMiddleware);
app.use(cookieParser());
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ limit: "1mb", extended: true }));
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || origin.includes("localhost") || origin.includes(".onrender.com") || origin === process.env.FRONTEND_URL) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true
}));



// Test the DB Connection on Startup
pool.connect(async (err, client, release) => {
  if (err) {
    console.error("Error aquiring client: ", err.stack);
  } else {
    console.log("Successfully connected to PostgreSQL database");
    try {
      const fs = await import('fs');
      const path = await import('path');
      const { fileURLToPath } = await import('url');
      const __filename = fileURLToPath(import.meta.url);
      const __dirname = path.dirname(__filename);

      // Check support_tickets table (002)
      const res002 = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE  table_schema = 'public'
          AND    table_name   = 'support_tickets'
        );
      `);
      const resolveSqlPath = (filename) => {
        const candidates = [
          path.join(__dirname, '../database/migrations', filename),
          path.join('/database/migrations', filename),
          path.join(__dirname, 'database/migrations', filename)
        ];
        for (const p of candidates) {
          if (fs.existsSync(p)) return p;
        }
        return null;
      };

      if (!res002.rows[0].exists) {
        console.log("Running 002_support_chat.sql migration...");
        const sqlPath002 = resolveSqlPath('002_support_chat.sql');
        if (sqlPath002) {
          const sql002 = fs.readFileSync(sqlPath002, 'utf8');
          await client.query(sql002);
          console.log("Migration 002_support_chat.sql completed.");
        } else {
          console.warn("Migration file 002_support_chat.sql not found in any candidate paths.");
        }
      }

      // Check platform_settings table (003)
      const res003 = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE  table_schema = 'public'
          AND    table_name   = 'platform_settings'
        );
      `);
      if (!res003.rows[0].exists) {
        console.log("Running 003_superadmin_setup.sql migration...");
        const sqlPath003 = resolveSqlPath('003_superadmin_setup.sql');
        if (sqlPath003) {
          const sql003 = fs.readFileSync(sqlPath003, 'utf8');
          await client.query(sql003);
          console.log("Migration 003_superadmin_setup.sql completed.");
        } else {
          console.warn("Migration file 003_superadmin_setup.sql not found in any candidate paths.");
        }
      }

      // Check institutions count (004 seed)
      const instCountRes = await client.query(`SELECT COUNT(*) FROM institutions;`);
      if (parseInt(instCountRes.rows[0].count, 10) === 0) {
        console.log("Running 004_seed_partner_institutions.sql migration...");
        const sqlPath004 = resolveSqlPath('004_seed_partner_institutions.sql');
        if (sqlPath004) {
          const sql004 = fs.readFileSync(sqlPath004, 'utf8');
          await client.query(sql004);
          console.log("Migration 004_seed_partner_institutions.sql completed.");
        } else {
          console.warn("Migration file 004_seed_partner_institutions.sql not found in any candidate paths.");
        }
      }
    } catch (migErr) {
      console.error("Error running migration:", migErr);
    }
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

if (!process.env.RISK_ENGINE_API_KEY) {
  console.error("ERROR: RISK_ENGINE_API_KEY environment variable is not set. Exiting.");
  process.exit(1);
}

// Basic Health Check Route
const healthHandler = (req, res) => {
  res.status(200).json({
    status: "API Gateway is online",
    db_connected: true,
    timestamp: new Date().toISOString(),
    service: "backend-gateway"
  });
};
app.get("/health", healthHandler);
app.get("/api/health", healthHandler);

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

app.use("/api/notifications", notificationRoutes);
app.use("/api/sse", sseRoutes);
app.use("/api/webhooks", webhookRoutes);
app.use("/uploads", authenticateToken, fileRoutes);

// Start background jobs
startLoanScheduler();
app.use("/api/loans", authenticateToken, loanRoutes);
app.use("/api/transactions", authenticateToken, requireRole("INSTITUTION_ADMIN"), transactionRoutes);
app.use("/api/support", authenticateToken, supportRoutes);
app.use("/api/superadmin", authenticateToken, requireRole("SUPER_ADMIN"), superadminRoutes);

app.listen(PORT, () => {
  console.log(`API Gateway is running on http://localhost:${PORT}`);
});
