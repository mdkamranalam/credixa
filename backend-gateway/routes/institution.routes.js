import express from "express";
import pool from "../utils/db.js";
import dotenv from "dotenv";

dotenv.config();
const router = express.Router();
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
