import express from "express";
import pg from "pg";
import dotenv from "dotenv";
import { authenticateToken } from "../middleware/auth.middleware.js";
import { upload as diskUpload } from "../middleware/upload.middleware.js";

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


router.get("/profile", authenticateToken, async (req, res) => {
  const userId = req.user.id;

  try {
    const profileQuery = `
            SELECT 
                u.full_name, 
                u.email, 
                u.mobile_number, 
                u.pan_number, 
                u.college_roll_number, 
                u.kyc_status,
                i.name AS college_name 
            FROM users u
            LEFT JOIN institutions i ON u.institution_id = i.institution_id
            WHERE u.user_id = $1;
        `;

    const result = await pool.query(profileQuery, [userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "User profile not found." });
    }

    const [docsRes, coAppRes] = await Promise.all([
      pool.query(
        "SELECT doc_id, category, doc_type, is_verified, file_url FROM loan_documents WHERE user_id = $1",
        [userId]
      ),
      pool.query("SELECT * FROM co_applicants WHERE user_id = $1 LIMIT 1", [
        userId,
      ]),
    ]);

    const userProfile = result.rows[0];
    userProfile.documents = docsRes.rows;
    userProfile.co_applicant = coAppRes.rows[0] || null;

    res.status(200).json(userProfile);
  } catch (error) {
    console.error("Profile Fetch Error:", error.message);
    res.status(500).json({ error: "Failed to fetch profile." });
  }
});

// Upload a static KYC/Academic document persistently attached to the user
router.post(
  "/documents",
  authenticateToken,
  diskUpload.single("file"),
  async (req, res) => {
    const userId = req.user.id;
    const { owner_type, category, doc_type } = req.body;

    if (!req.file) return res.status(400).json({ error: "No file uploaded." });
    if (!owner_type || !category || !doc_type) {
      return res.status(400).json({ error: "Missing document metadata." });
    }

    const file_url = req.file.path;

    try {
      const insertQuery = `
        INSERT INTO loan_documents (user_id, owner_type, category, doc_type, file_url)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *;
      `;
      const result = await pool.query(insertQuery, [
        userId,
        owner_type,
        category,
        doc_type,
        file_url,
      ]);
      res.status(201).json({
        message: "Document uploaded successfully",
        document: result.rows[0],
      });
    } catch (error) {
      console.error("User doc upload error:", error);
      res.status(500).json({ error: "Failed to save document." });
    }
  }
);

// Save or Update the User's permanent Co-Applicant
router.post("/co-applicant", authenticateToken, async (req, res) => {
  const userId = req.user.id;
  const {
    full_name,
    relationship,
    aadhaar_number,
    pan_number,
    income_type,
    monthly_income,
  } = req.body;

  if (!full_name || !relationship || !pan_number) {
    return res.status(400).json({ error: "Missing required details." });
  }

  try {
    // We use a simple SELECT then INSERT/UPDATE because `user_id` might not be strictly UNIQUE on co_applicants in all setups
    // But conceptually, one student = one co_applicant (for the prototype)
    const existing = await pool.query(
      "SELECT * FROM co_applicants WHERE user_id = $1",
      [userId]
    );

    let result;
    if (existing.rows.length > 0) {
      const updateQuery = `
          UPDATE co_applicants 
          SET full_name = $1, relationship = $2, aadhaar_number = $3, pan_number = $4, income_type = $5, monthly_income = $6, updated_at = NOW()
          WHERE user_id = $7
          RETURNING *;
        `;
      const updateRes = await pool.query(updateQuery, [
        full_name,
        relationship,
        aadhaar_number,
        pan_number,
        income_type,
        monthly_income || 0,
        userId,
      ]);
      result = updateRes.rows[0];
    } else {
      const insertQuery = `
          INSERT INTO co_applicants (user_id, full_name, relationship, aadhaar_number, pan_number, income_type, monthly_income)
          VALUES ($1, $2, $3, $4, $5, $6, $7)
          RETURNING *;
        `;
      const insertRes = await pool.query(insertQuery, [
        userId,
        full_name,
        relationship,
        aadhaar_number,
        pan_number,
        income_type,
        monthly_income || 0,
      ]);
      result = insertRes.rows[0];
    }

    res.status(201).json({
      message: "Co-applicant saved successfully",
      co_applicant: result,
    });
  } catch (error) {
    console.error("Co-applicant error:", error);
    if (error.code === "23505") {
      return res.status(400).json({
        error: "Aadhaar or PAN already exists for another active application.",
      });
    }
    res.status(500).json({ error: "Failed to save co-applicant." });
  }
});

export default router;
