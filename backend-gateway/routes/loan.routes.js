import express from "express";
import multer from "multer";
import FormData from "form-data";
import axios from "axios";
import fs from "fs";
import pg from "pg";
import { authenticateToken } from "../middleware/auth.middleware.js";
import dotenv from "dotenv";

dotenv.config();
const router = express.Router();

// Set up Multer to store PDFs in memory (no disk I/O slowing us down)
const memoryUpload = multer({ storage: multer.memoryStorage() });
import { upload as diskUpload } from "../middleware/upload.middleware.js";
import { uploadDocument, addCoApplicant } from "../controllers/loan.controller.js";

// Database pool for saving the final score
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


// The Python Risk Engine URL
const RISK_ENGINE_URL =
  process.env.RISK_ENGINE_URL || "http://localhost:8000/analyze-statement";

// The Co-Borrower Score Endoint
router.post(
  "/apply",
  authenticateToken,
  diskUpload.fields([
    { name: "student_statement", maxCount: 1 },
    { name: "parent_statement", maxCount: 1 },
    { name: "latest_marksheet", maxCount: 1 },
  ]),
  async (req, res) => {
    const userId = req.user.id;
    const {
      existing_loan_id,
      requested_amount,
      interest_rate,
      tenure_months,
      student_account_number,
      ifsc_code,
    } = req.body;

    if (!req.files.student_statement || !req.files.parent_statement) {
      return res
        .status(400)
        .json({ error: "Student statement and parent statement are required." });
    }
    if (!existing_loan_id) {
      return res.status(400).json({ error: "existing_loan_id is required." });
    }

    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      // Verify user owns the loan
      const verifyQuery = await client.query("SELECT * FROM loans WHERE loan_id = $1 AND user_id = $2", [existing_loan_id, userId]);
      if (verifyQuery.rows.length === 0) {
        return res.status(403).json({ error: "Unauthorized or loan not found." });
      }

      // Update the loan to change status to UNDER_REVIEW
      const loanUpdate = `
        UPDATE loans 
        SET 
          requested_amount = COALESCE($1, requested_amount),
          interest_rate = COALESCE($2, interest_rate),
          tenure_months = COALESCE($3, tenure_months),
          student_account_number = COALESCE($4, student_account_number),
          student_ifsc_code = COALESCE($5, student_ifsc_code),
          status = 'UNDER_REVIEW',
          updated_at = NOW()
        WHERE loan_id = $6
        RETURNING *;
      `;
      const loanRes = await client.query(loanUpdate, [
        requested_amount,
        interest_rate,
        tenure_months,
        student_account_number,
        ifsc_code,
        existing_loan_id
      ]);
      const loanId = loanRes.rows[0].loan_id;

      // 3. Save all 3 files to loan_documents perpetually
      const insertDoc = `INSERT INTO loan_documents (loan_id, user_id, owner_type, category, doc_type, file_url) VALUES ($1, $2, $3, $4, $5, $6)`;

      await client.query(insertDoc, [loanId, userId, "STUDENT", "FINANCIAL", "STUDENT_BANK_STATEMENT", req.files.student_statement[0].path]);
      await client.query(insertDoc, [loanId, userId, "CO_APPLICANT", "FINANCIAL", "PARENT_BANK_STATEMENT", req.files.parent_statement[0].path]);
      if (req.files.latest_marksheet) {
        await client.query(insertDoc, [loanId, userId, "STUDENT", "ACADEMIC", "LATEST_MARKSHEET", req.files.latest_marksheet[0].path]);
      }

      // 4. Prepare FormData for Axios Risk Engine
      const formData = new FormData();
      formData.append(
        "student_file",
        fs.createReadStream(req.files.student_statement[0].path),
      );
      formData.append(
        "parent_file",
        fs.createReadStream(req.files.parent_statement[0].path),
      );

      // 4. Send to Python ML Engine using AXIOS
      const pythonResponse = await axios.post(
        RISK_ENGINE_URL,
        formData,
        {
          headers: {
            ...formData.getHeaders(),
          },
        },
      );

      // Axios automatically parses the JSON, so we just grab .data
      const aiResult = pythonResponse.data;

      // 5. Schema Math: Convert AI % to CIBIL integer scale (0-900)
      const cibilScore = Math.round((aiResult.omniscore / 100) * 900);
      const riskTier =
        cibilScore >= 700
          ? "LOW_RISK"
          : cibilScore >= 500
            ? "MEDIUM_RISK"
            : "HIGH_RISK";
      const defaultProb = 1 - aiResult.omniscore / 100;

      // 6. Insert Risk Score
      const riskInsert = `
            INSERT INTO risk_scores (loan_id, omniscore, probability_of_default, risk_tier)
            VALUES ($1, $2, $3, $4);
        `;
      await client.query(riskInsert, [
        loanId,
        cibilScore,
        defaultProb,
        riskTier,
      ]);

      await client.query("COMMIT");

      res.status(200).json({
        message: "Application sent to Admin for review!",
        loan_id: loanId,
        status: "UNDER_REVIEW",
        omniscore_cibil_scale: cibilScore,
        risk_tier: riskTier,
      });
    } catch (error) {
      await client.query("ROLLBACK");

      // Better error logging for Axios
      if (error.response) {
        console.error(
          "Python AI Error:",
          JSON.stringify(error.response.data, null, 2),
        );
      } else {
        console.error("Loan Application Error:", error.message);
      }

      res.status(500).json({ error: "Failed to process loan application." });
    } finally {
      client.release();
    }
  },
);

router.post("/initialize", authenticateToken, async (req, res) => {
  const userId = req.user.id;
  const {
    requested_amount,
    interest_rate,
    tenure_months,
    student_account_number,
    ifsc_code,
  } = req.body;

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const userQuery = await client.query(
      "SELECT institution_id FROM users WHERE user_id = $1",
      [userId],
    );

    if (userQuery.rows.length === 0 || !userQuery.rows[0].institution_id) {
      return res.status(400).json({
        error: "No institution linked to this user.",
      });
    }

    const dbInstitutionId = userQuery.rows[0].institution_id;

    const loanInsert = `
        INSERT INTO loans (
          user_id, institution_id, requested_amount, interest_rate, tenure_months, student_account_number, student_ifsc_code, status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'APPLIED') 
        RETURNING *;
      `;
    const loanRes = await client.query(loanInsert, [
      userId, dbInstitutionId, requested_amount, interest_rate, tenure_months, student_account_number, ifsc_code,
    ]);
    const loanId = loanRes.rows[0].loan_id;

    await client.query("COMMIT");

    res.status(200).json({
      message: "Application initialized",
      loan_id: loanId,
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Initialize Loan Error:", error.message);
    res.status(500).json({ error: "Failed to initialize application." });
  } finally {
    client.release();
  }
});

// Upload a specific document for a loan application
router.post(
  "/:loanId/documents",
  authenticateToken,
  diskUpload.single("file"), // "file" is the form field name
  uploadDocument
);

// Add a co-applicant to a loan application
router.post(
  "/:loanId/co-applicant",
  authenticateToken,
  addCoApplicant
);

router.get("/my-loan", authenticateToken, async (req, res) => {
  try {
    const query = `
      SELECT loan_id, requested_amount, approved_amount, interest_rate, tenure_months, status, created_at 
      FROM loans 
      WHERE user_id = $1 
      ORDER BY created_at DESC 
      LIMIT 1;
    `;
    const result = await pool.query(query, [req.user.id]);

    if (result.rows.length === 0) {
      return res.status(200).json(null);
    }

    res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error("Fetch My Loan Error:", error.message);
    res.status(500).json({ error: "Failed to fetch loan details." });
  }
});

router.post("/repay", authenticateToken, async (req, res) => {
  const { loan_id, amount } = req.body;
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const txnQuery = `
      INSERT INTO transactions (loan_id, user_id, amount, txn_type, status, gateway_txn_id)
      VALUES ($1, $2, $3, 'REPAYMENT', 'SUCCESS', $4)
      RETURNING *;
    `;
    const txnResult = await client.query(txnQuery, [
      loan_id,
      req.user.id,
      amount,
      `PAY-${Date.now()}`,
    ]);

    const scheduleUpdate = `
      UPDATE repayment_schedules 
      SET status = 'PAID', paid_at = NOW()
      WHERE schedule_id = (
        SELECT schedule_id FROM repayment_schedules 
        WHERE loan_id = $1 AND status = 'PENDING'
        ORDER BY due_date ASC LIMIT 1
      ) RETURNING schedule_id;
    `;
    const scheduleResult = await client.query(scheduleUpdate, [loan_id]);

    const checkRemaining = await client.query(
      "SELECT COUNT(*) FROM repayment_schedules WHERE loan_id = $1 AND status = 'PENDING'",
      [loan_id],
    );

    let loanClosed = false;
    if (parseInt(checkRemaining.rows[0].count) === 0) {
      await client.query(
        "UPDATE loans SET status = 'CLOSED', updated_at = NOW() WHERE loan_id = $1",
        [loan_id],
      );
      loanClosed = true;
    }

    await client.query("COMMIT");
    res.status(200).json({
      message: loanClosed
        ? "Loan fully repaid and CLOSED!"
        : "Payment successful!",
      transaction: txnResult.rows[0],
      isClosed: loanClosed,
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Repayment Error:", error.message);
    res.status(500).json({ error: "Failed to process payment." });
  } finally {
    client.release();
  }
});

router.get("/repayments", authenticateToken, async (req, res) => {
  try {
    const query = `
      SELECT 
        txn_id AS id, 
        amount, 
        created_at AS date, 
        status, 
        'UPI' AS method 
      FROM transactions 
      WHERE user_id = $1 AND txn_type = 'REPAYMENT'
      ORDER BY created_at DESC;
    `;
    const result = await pool.query(query, [req.user.id]);
    res.status(200).json(result.rows);
  } catch (error) {
    console.error("Fetch Repayments Error:", error.message);
    res.status(500).json({ error: "Failed to load payment history." });
  }
});

router.put("/loans/:loanId/status", authenticateToken, async (req, res) => {
  const { loanId } = req.params;
  const { status, approved_amount } = req.body;

  const client = await pool.connect();

  try {
    await client.query("BEGIN");
    console.log("Attempting to approve loan:", loanId);

    // 1. Update the Loan Status
    const updateResult = await client.query(
      `UPDATE loans SET status = $1, approved_amount = $2, updated_at = NOW() 
             WHERE loan_id = $3 RETURNING *`,
      [status, approved_amount, loanId],
    );
    const loan = updateResult.rows[0];

    // 2. If APPROVED, generate the 12-month schedule (Table 6)
    if (status === "APPROVED" || status === "ACTIVE") {
      const months = loan.tenure_months;
      const p = parseFloat(approved_amount);
      const r = parseFloat(loan.interest_rate) / 100 / 12;

      // EMI Formula
      const emi =
        (p * r * Math.pow(1 + r, months)) / (Math.pow(1 + r, months) - 1);

      for (let i = 1; i <= months; i++) {
        const dueDate = new Date();
        dueDate.setMonth(dueDate.getMonth() + i);

        await client.query(
          `INSERT INTO repayment_schedules (loan_id, due_date, emi_amount, status) 
                     VALUES ($1, $2, $3, 'PENDING')`,
          [loanId, dueDate, Math.round(emi)],
        );
      }
    }

    await client.query("COMMIT");
    res
      .status(200)
      .json({ message: "Loan status updated and schedule generated!" });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Schedule Error:", error.message);
    res.status(500).json({ error: "Failed to process approval." });
  } finally {
    client.release();
  }
});

router.get("/next-payment", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const query = `
      SELECT 
        rs.due_date, 
        rs.emi_amount as next_emi_amount, 
        l.loan_id,
        l.status as loan_status,
        l.approved_amount,  -- ADDED THIS
        l.interest_rate,    -- ADDED THIS
        l.tenure_months,    -- ADDED THIS
        (SELECT COUNT(*) FROM repayment_schedules WHERE loan_id = l.loan_id) as total_months,
        (SELECT COUNT(*) FROM repayment_schedules WHERE loan_id = l.loan_id AND status = 'PAID') as months_paid,
        (SELECT SUM(emi_amount) FROM repayment_schedules WHERE loan_id = l.loan_id AND status = 'PENDING') as remaining_balance
      FROM loans l
      LEFT JOIN repayment_schedules rs ON l.loan_id = rs.loan_id AND rs.status = 'PENDING'
      WHERE l.user_id = $1 AND l.status IN ('APPROVED', 'ACTIVE', 'CLOSED') -- ADDED 'CLOSED'
      ORDER BY rs.due_date ASC 
      LIMIT 1;
    `;

    const result = await pool.query(query, [userId]);

    if (result.rows.length === 0) {
      return res.status(200).json({ message: "No upcoming payments found." });
    }

    res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error("Fetch Next Payment Error:", error.message);
    res.status(500).json({ error: "Failed to load payment details." });
  }
});

export default router;
