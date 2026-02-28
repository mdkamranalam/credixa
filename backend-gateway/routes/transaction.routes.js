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
  password: process.env.DB_PASSWORD || "admin@123",
  port: process.env.DB_PORT || 5432,
});

pool.on('error', (err, client) => {
  console.error('Unexpected error on idle client', err);
});


router.post("/disburse", async (req, res) => {
  const { loan_id } = req.body;

  if (!loan_id) {
    return res.status(400).json({ error: "loan_id is required." });
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const loanQuery = `
            SELECT l.approved_amount, l.status, l.user_id, i.bank_account_number, i.institution_id
            FROM loans l
            JOIN institutions i ON l.institution_id = i.institution_id
            WHERE l.loan_id = $1 FOR UPDATE;
        `;
    const loanResult = await client.query(loanQuery, [loan_id]);

    if (loanResult.rows.length === 0) {
      throw new Error("Loan not found.");
    }

    const loan = loanResult.rows[0];

    if (loan.status !== "APPROVED") {
      throw new Error(
        `Cannot disburse. Loan status is currently: ${loan.status}`,
      );
    }

    // Insert Transaction using ENUMs
    const transactionQuery = `
            INSERT INTO transactions (loan_id, user_id, amount, txn_type, status)
            VALUES ($1, $2, $3, 'DISBURSAL', 'SUCCESS') 
            RETURNING txn_id, created_at;
        `;
    const txResult = await client.query(transactionQuery, [
      loan_id,
      loan.user_id,
      loan.approved_amount,
    ]);

    // Update Loan Status to 'ACTIVE' and stamp the disbursal time
    await client.query(
      `UPDATE loans SET status = 'ACTIVE', disbursed_at = NOW() WHERE loan_id = $1`,
      [loan_id],
    );

    await client.query("COMMIT");

    res.status(200).json({
      message: "Funds Disbursed Successfully",
      txn_id: txResult.rows[0].txn_id,
      destination_account: loan.bank_account_number,
      amount: loan.approved_amount,
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Disbursal Error:", error.message);
    res.status(400).json({ error: error.message });
  } finally {
    client.release();
  }
});

export default router;
