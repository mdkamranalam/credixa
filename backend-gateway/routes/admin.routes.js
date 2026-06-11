import express from "express";
import pool from "../utils/db.js";
import dotenv from "dotenv";
import multer from "multer";
import path from "path";
import fs from "fs/promises";
import { enhancedAuthenticateToken, authenticateToken } from "../middleware/auth.middleware.js";
import { calculateEMI } from "../utils/loan.utils.js";

dotenv.config();
const router = express.Router();

// Configure storage for the "Document Vault" with enhanced security
const storage = multer.diskStorage({
  destination: "./uploads/loan_docs/",
  filename: (req, file, cb) => {
    // Sanitize filename to prevent directory traversal attacks
    const loanId = req.params.loanId;
    const timestamp = Date.now();
    const sanitizedFilename = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '');

    // Additional validation for loan ID
    const loanIdPattern = /^[a-zA-Z0-9\-_]+$/;
    if (!loanIdPattern.test(loanId)) {
      return cb(new Error("Invalid loan ID format"));
    }

    cb(null, `${loanId}_${timestamp}_${sanitizedFilename}`);
  }
});

// Enhanced multer configuration with file size limits and type validation
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Define allowed file types
    const allowedTypes = [
      'application/pdf',
      'image/jpeg',
      'image/jpg',
      'image/png',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain'
    ];

    // Check file type
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, JPG, PNG, DOC, DOCX, and TXT files are allowed.'));
    }
  }
});

router.post("/loans/:loanId/co-applicant", authenticateToken, async (req, res) => {
  const { loanId } = req.params;
  const { full_name, relationship, income_type, monthly_income, aadhaar, pan } = req.body;

  try {
    const query = `
      INSERT INTO co_applicants (loan_id, full_name, relationship, income_type, monthly_income, aadhaar_number, pan_number)
      VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *;
    `;
    const result = await pool.query(query, [loanId, full_name, relationship, income_type, monthly_income, aadhaar, pan]);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: "Failed to save co-applicant details." });
  }
});

router.post("/loans/:loanId/upload-doc", enhancedAuthenticateToken, upload.single("document"), async (req, res) => {
  const { loanId } = req.params;
  const { owner_type, category, doc_type } = req.body;
  const fileUrl = req.file.path;

  try {
    // Input validation
    if (!loanId || typeof loanId !== 'string' || loanId.trim() === '') {
      return res.status(400).json({ error: "Valid loan ID is required." });
    }

    // Additional validation for loan ID format
    const loanIdPattern = /^[a-zA-Z0-9\-_]+$/;
    if (!loanIdPattern.test(loanId)) {
      return res.status(400).json({ error: "Invalid loan ID format." });
    }

    // Validate document type
    const validTypes = ['PAN', 'AADHAAR', 'BANK_STATEMENT', 'INCOME_PROOF', 'COLLEGE_ID', 'OTHER'];
    if (!doc_type || !validTypes.includes(doc_type)) {
      return res.status(400).json({ error: "Valid document type is required." });
    }

    // Additional security: validate file path to prevent directory traversal
    if (!fileUrl.startsWith('./uploads/loan_docs/')) {
      return res.status(400).json({ error: "Invalid file path." });
    }

    // Additional security: validate file name
    const fileName = req.file.filename;
    const fileNamePattern = /^[a-zA-Z0-9\-_]+_[0-9]+_[a-zA-Z0-9._-]+$/;
    if (!fileNamePattern.test(fileName)) {
      return res.status(400).json({ error: "Invalid file name format." });
    }

    const query = `
      INSERT INTO loan_documents (loan_id, owner_type, category, doc_type, file_url)
      VALUES ($1, $2, $3, $4, $5) RETURNING *;
    `;
    const result = await pool.query(query, [loanId, owner_type, category, doc_type, fileUrl]);
    res.status(201).json({ message: "Document uploaded successfully", doc: result.rows[0] });
  } catch (err) {
    console.error("Document upload error:", err);
    res.status(500).json({ error: "Document upload failed." });
  }
});

router.get("/loans/:loanId/details", authenticateToken, async (req, res) => {
  const { loanId } = req.params;
  try {
    const [loanInfo, coAppInfo, docsInfo] = await Promise.all([
      pool.query("SELECT * FROM loans WHERE loan_id = $1", [loanId]),
      pool.query("SELECT * FROM co_applicants WHERE loan_id = $1", [loanId]),
      pool.query("SELECT * FROM loan_documents WHERE loan_id = $1", [loanId])
    ]);

    res.status(200).json({
      loan: loanInfo.rows[0],
      coApplicant: coAppInfo.rows[0],
      documents: docsInfo.rows
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch full application details." });
  }
});

router.get("/loans", authenticateToken, async (req, res) => {
  if (req.user.role !== "INSTITUTION_ADMIN") {
    return res.status(403).json({ error: "Admins only." });
  }

  try {
    const query = `
    SELECT
    l.loan_id,
    l.user_id,
      u.full_name,
      u.college_roll_number,
      u.analysis_reasoning,
      u.analysis_highlights,
      l.requested_amount,
      l.status,
      rs.omniscore,
      rs.risk_tier,
      --Fetches total installments for the progress bar
        (SELECT COUNT(*) FROM repayment_schedules WHERE loan_id = l.loan_id) as total_installments,
        --Fetches paid installments for real - time progress tracking
          (SELECT COUNT(*) FROM repayment_schedules WHERE loan_id = l.loan_id AND status = 'PAID') as installments_paid,
          --Needed for the 'Total Disbursed' summary card
    l.approved_amount
  FROM loans l
  JOIN users u ON l.user_id = u.user_id
  LEFT JOIN risk_scores rs ON l.loan_id = rs.loan_id
  WHERE l.institution_id = $1
  ORDER BY l.created_at DESC;
    `;

    const result = await pool.query(query, [req.user.institution_id]);
    res.status(200).json(result.rows);
  } catch (error) {
    console.error("Admin Fetch Error:", error.message);
    res.status(500).json({ error: "Failed to fetch loans." });
  }
});

router.put("/loans/:loanId/status", enhancedAuthenticateToken, async (req, res) => {
  if (req.user.role !== "INSTITUTION_ADMIN") {
    return res.status(403).json({ error: "Access denied." });
  }

  const { loanId } = req.params;
  const { status, approved_amount } = req.body;
  const client = await pool.connect();

  try {
    // Input validation
    if (!loanId || typeof loanId !== 'string' || loanId.trim() === '') {
      return res.status(400).json({ error: "Valid loan ID is required." });
    }

    // Additional validation for loan ID format
    const loanIdPattern = /^[a-zA-Z0-9\-_]+$/;
    if (!loanIdPattern.test(loanId)) {
      return res.status(400).json({ error: "Invalid loan ID format." });
    }

    if (status && typeof status !== 'string') {
      return res.status(400).json({ error: "Valid status is required." });
    }

    // Validate approved_amount if provided
    if (approved_amount !== undefined && (isNaN(approved_amount) || approved_amount <= 0)) {
      return res.status(400).json({ error: "Valid approved amount (positive number) is required." });
    }

    // Additional security: validate that the user has proper institution access
    if (!req.user || !req.user.institution_id) {
      return res.status(403).json({ error: "Unauthorized access." });
    }

    await client.query("BEGIN");

    // 1. Update the Loan Status
    const updateQuery = `
            UPDATE loans
            SET status = $1, approved_amount = COALESCE($2, requested_amount), updated_at = NOW()
            WHERE loan_id = $3 AND institution_id = $4
    RETURNING *;
    `;
    const result = await client.query(updateQuery, [
      status,
      approved_amount || null,
      loanId,
      req.user.institution_id,
    ]);

    if (result.rows.length === 0) {
      throw new Error("Loan not found or unauthorized.");
    }

    const loan = result.rows[0];

    // 2. TRIGGER: Populate repayment_schedules (Table 6)
    if (status === "APPROVED" || status === "ACTIVE") {
      const months = loan.tenure_months;
      const emi = calculateEMI(loan.approved_amount, loan.interest_rate, months);

      // Validate tenure and EMI calculation
      if (months <= 0 || isNaN(emi) || emi <= 0) {
        throw new Error("Invalid loan terms for EMI calculation.");
      }

      for (let i = 1; i <= months; i++) {
        const dueDate = new Date();
        dueDate.setMonth(dueDate.getMonth() + i);

        await client.query(
          `INSERT INTO repayment_schedules(loan_id, due_date, emi_amount, status)
    VALUES($1, $2, $3, 'PENDING')`,
          [loanId, dueDate, Math.round(emi)],
        );
      }
      const disbursalTxn = `
                INSERT INTO transactions(
      loan_id, user_id, amount, txn_type, status, gateway_txn_id, idempotency_key
    ) VALUES($1, $2, $3, 'DISBURSAL', 'SUCCESS', $4, $5);
    `;

      await client.query(disbursalTxn, [
        loanId,
        loan.user_id,
        loan.approved_amount,
        `DB - GATEWAY - ${Date.now()} `,
        `DISB - ${loanId} `,
      ]);
    }

    await client.query("COMMIT");
    res
      .status(200)
      .json({ message: "Loan approved and schedule generated!", loan });
  } catch (error) {
    await client.query("ROLLBACK");
    // Don't expose internal error details to client
    res.status(500).json({ error: "Internal server error occurred during loan approval." });
  } finally {
    client.release();
  }
});

router.get("/institution-profile", authenticateToken, async (req, res) => {
  try {
    const institutionId = req.user.institution_id;

    const query = `
      SELECT name, bank_name, bank_account_number, ifsc_code 
      FROM institutions 
      WHERE institution_id = $1
      `;

    const result = await pool.query(query, [institutionId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Institution details not found." });
    }

    res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error("Fetch Institution Error:", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/transactions", authenticateToken, async (req, res) => {
  try {
    const institutionId = req.user.institution_id; //

    const query = `
    SELECT
    t.txn_id AS id,
      u.full_name AS student_name,
        t.amount,
        t.txn_type,
        t.status,
        t.created_at AS date
      FROM transactions t
      JOIN users u ON t.user_id = u.user_id
      WHERE t.loan_id IN(SELECT loan_id FROM loans WHERE institution_id = $1)
      ORDER BY t.created_at DESC;
    `;

    const result = await pool.query(query, [institutionId]);
    res.status(200).json(result.rows);
  } catch (error) {
    console.error("Admin Txn Fetch Error:", error.message);
    res.status(500).json({ error: "Failed to fetch global transactions." });
  }
});

router.get("/portfolio-summary", authenticateToken, async (req, res) => {
  if (req.user.role !== "INSTITUTION_ADMIN") {
    return res.status(403).json({ error: "Access denied." });
  }

  try {
    const query = `
    SELECT
    u.full_name,
      l.loan_id,
      l.status as loan_status,
      l.approved_amount,
      COUNT(rs.schedule_id) as total_installments,
      COUNT(CASE WHEN rs.status = 'PAID' THEN 1 END) as installments_paid,
      SUM(CASE WHEN rs.status = 'PENDING' THEN rs.emi_amount ELSE 0 END) as remaining_balance
      FROM loans l
      JOIN users u ON l.user_id = u.user_id
      LEFT JOIN repayment_schedules rs ON l.loan_id = rs.loan_id
      WHERE l.institution_id = $1
      GROUP BY u.full_name, l.loan_id, l.status, l.approved_amount;
    `;

    const result = await pool.query(query, [req.user.institution_id]);
    res.status(200).json(result.rows);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch portfolio." });
  }
});

// --- STUDENT PROFILE VIEWER ---
router.get("/students/:userId", authenticateToken, async (req, res) => {
  if (req.user.role !== "INSTITUTION_ADMIN" && req.user.role !== "ADMIN") {
    return res.status(403).json({ error: "Admins only." });
  }

  const { userId } = req.params;

  try {
    const [userRes, docsRes, coAppRes] = await Promise.all([
      pool.query(
        "SELECT user_id, full_name, email, mobile_number, pan_number, kyc_status, dob, current_address, college_roll_number, academic_status FROM users WHERE user_id = $1",
        [userId]
      ),
      pool.query(
        "SELECT doc_id, category, doc_type, is_verified, file_url, uploaded_at FROM loan_documents WHERE user_id = $1",
        [userId]
      ),
      pool.query("SELECT * FROM co_applicants WHERE user_id = $1 LIMIT 1", [
        userId,
      ]),
    ]);

    if (userRes.rows.length === 0) {
      return res.status(404).json({ error: "Student not found." });
    }

    res.status(200).json({
      user: userRes.rows[0],
      documents: docsRes.rows,
      co_applicant: coAppRes.rows[0] || null,
    });
  } catch (error) {
    console.error("Admin Student Fetch Error:", error.message);
    res.status(500).json({ error: "Failed to fetch student dossier." });
  }
});

// --- DYNAMIC CHECKLIST ROUTES ---

router.get("/checklist", authenticateToken, async (req, res) => {
  if (req.user.role !== "INSTITUTION_ADMIN" && req.user.role !== "ADMIN") {
    return res.status(403).json({ error: "Admins only." });
  }
  
  try {
    const institutionId = req.user.institution_id;
    const query = `SELECT checklist FROM institutions WHERE institution_id = $1`;
    const result = await pool.query(query, [institutionId]);
    
    const checklistData = result.rows[0]?.checklist || [];
    res.status(200).json(checklistData);
  } catch (err) {
    console.error("Failed to read checklist:", err);
    res.status(500).json({ error: "Failed to load checklist configuration." });
  }
});

router.put("/checklist", authenticateToken, async (req, res) => {
  if (req.user.role !== "INSTITUTION_ADMIN" && req.user.role !== "ADMIN") {
    return res.status(403).json({ error: "Admins only." });
  }

  try {
    const newChecklist = req.body;
    const institutionId = req.user.institution_id;

    // Input validation for checklist data
    if (!newChecklist || typeof newChecklist !== 'object') {
      return res.status(400).json({ error: "Valid checklist data is required." });
    }

    const checklistJson = JSON.stringify(newChecklist, null, 2);

    if (checklistJson.length > 100000) { // 100KB limit
      return res.status(400).json({ error: "Checklist data too large." });
    }

    try {
      const parsedChecklist = JSON.parse(checklistJson);

      const dangerousPatterns = ['__proto__', 'constructor', 'prototype'];
      const hasDangerousKeys = Object.keys(parsedChecklist).some(key =>
        dangerousPatterns.includes(key)
      );

      if (hasDangerousKeys) {
        return res.status(400).json({ error: "Invalid checklist structure detected." });
      }

      if (Array.isArray(parsedChecklist)) {
        for (const item of parsedChecklist) {
          if (typeof item !== 'object' || !item.title || !item.description) {
            return res.status(400).json({ error: "Invalid checklist item format." });
          }
          if (typeof item.title !== 'string' || typeof item.description !== 'string') {
            return res.status(400).json({ error: "Checklist item title and description must be strings." });
          }
        }
      }

    } catch (parseError) {
      return res.status(400).json({ error: "Invalid checklist JSON format." });
    }

    const updateQuery = `UPDATE institutions SET checklist = $1 WHERE institution_id = $2`;
    await pool.query(updateQuery, [checklistJson, institutionId]);
    
    res.status(200).json({ message: "Checklist updated successfully." });
  } catch (err) {
    console.error("Failed to update checklist:", err);
    res.status(500).json({ error: "Failed to save checklist configuration." });
  }
});

export default router;
