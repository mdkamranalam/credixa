import express from "express";
import pg from "pg";
import dotenv from "dotenv";

dotenv.config();
const router = express.Router();

const { Pool } = pg;
const pool = new Pool({
  user: process.env.DB_USER || "credixa_admin",
  host: process.env.DB_HOST || "localhost",
  database: process.env.DB_NAME || "credixa_db",
  password: process.env.DB_PASSWORD || "securepassword",
  port: process.env.DB_PORT || 5432,
});

pool.on('error', (err, client) => {
  console.error('Unexpected error on idle client', err);
});


// GET /api/institutions - Fetches all active colleges for the dropdown
router.get("/", async (req, res) => {
  try {
    const query = `SELECT institution_id, name FROM institutions WHERE is_active = TRUE ORDER BY name ASC;`;
    const result = await pool.query(query);
    res.status(200).json(result.rows);
  } catch (error) {
    console.error("Database Error:", error.message);
    res.status(500).json({ error: "Failed to fetch institutions." });
  }
});

export default router;
