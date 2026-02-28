import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

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


export const uploadDocument = async (req, res) => {
    const { loanId } = req.params;
    const { owner_type, category, doc_type } = req.body;
    const userId = req.user.id;

    if (!req.file) {
        return res.status(400).json({ error: "No file uploaded." });
    }

    if (!owner_type || !category || !doc_type) {
        return res.status(400).json({ error: "Missing document metadata (owner_type, category, doc_type)." });
    }

    const file_url = req.file.path; // e.g., 'uploads/123456789-file.pdf'

    try {
        // 1. Verify the user actually owns this loan
        const verification = await pool.query("SELECT * FROM loans WHERE loan_id = $1 AND user_id = $2", [loanId, userId]);
        if (verification.rows.length === 0) {
            return res.status(403).json({ error: "Unauthorized or loan not found." });
        }

        // 2. Insert the document record
        const insertQuery = `
      INSERT INTO loan_documents (loan_id, owner_type, category, doc_type, file_url)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *;
    `;
        const result = await pool.query(insertQuery, [loanId, owner_type, category, doc_type, file_url]);

        res.status(201).json({
            message: "Document uploaded successfully",
            document: result.rows[0],
        });
    } catch (error) {
        console.error("Upload Document Error:", error);
        res.status(500).json({ error: "Failed to save document." });
    }
};

export const addCoApplicant = async (req, res) => {
    const { loanId } = req.params;
    const { full_name, relationship, aadhaar_number, pan_number, income_type, monthly_income } = req.body;
    const userId = req.user.id;

    if (!full_name || !relationship || !pan_number) {
        return res.status(400).json({ error: "Missing required co-applicant details." });
    }

    try {
        // 1. Verify user owns loan
        const verification = await pool.query("SELECT * FROM loans WHERE loan_id = $1 AND user_id = $2", [loanId, userId]);
        if (verification.rows.length === 0) {
            return res.status(403).json({ error: "Unauthorized or loan not found." });
        }

        // 2. Insert Co-Applicant
        const insertQuery = `
      INSERT INTO co_applicants (loan_id, full_name, relationship, aadhaar_number, pan_number, income_type, monthly_income)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *;
    `;
        const result = await pool.query(insertQuery, [
            loanId,
            full_name,
            relationship,
            aadhaar_number,
            pan_number,
            income_type,
            monthly_income || 0
        ]);

        res.status(201).json({
            message: "Co-applicant added successfully",
            co_applicant: result.rows[0],
        });
    } catch (error) {
        console.error("Add Co-Applicant Error:", error);
        // Usually unique constraint errors for PAN/Aadhaar
        if (error.code === '23505') {
            return res.status(400).json({ error: "Aadhaar or PAN already exists for another active application." });
        }
        res.status(500).json({ error: "Failed to add co-applicant." });
    }
};
