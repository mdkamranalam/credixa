import express from "express";
import pg from "pg";
import { authenticateToken } from "../middleware/auth.middleware.js";

const router = express.Router();
const pool = new pg.Pool();

router.post("/request", authenticateToken, async (req, res) => {
  const { aa_handle } = req.body;

  try {
    const query = `
      INSERT INTO consent_handles (user_id, aa_handle, consent_status, valid_from, valid_to)
      VALUES ($1, $2, 'PENDING', NOW(), NOW() + INTERVAL '1 year')
      RETURNING *;
    `;
    const result = await pool.query(query, [req.user.id, aa_handle]);
    res
      .status(201)
      .json({ message: "Consent request initiated!", data: result.rows[0] });
  } catch (error) {
    res.status(500).json({ error: "Failed to create consent handle." });
  }
});

router.put("/verify-kyc/:userId", authenticateToken, async (req, res) => {
  if (req.user.role !== "INSTITUTION_ADMIN") {
    return res.status(403).json({ error: "Unauthorized" });
  }

  try {
    const query = `
      UPDATE users 
      SET kyc_status = 'VERIFIED', updated_at = NOW() 
      WHERE user_id = $1 
      RETURNING user_id, full_name, kyc_status;
    `;
    const result = await pool.query(query, [req.params.userId]);
    res
      .status(200)
      .json({ message: "Student KYC Verified!", user: result.rows[0] });
  } catch (error) {
    res.status(500).json({ error: "KYC verification failed." });
  }
});

export default router;
