export const approveAndDisburse = async (req, res) => {
  const { loanId, approvedAmount } = req.body;
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // 1. Update Loan to 'ACTIVE' and set 'disbursed_at'
    const updateLoan = `
      UPDATE loans 
      SET status = 'ACTIVE', approved_amount = $1, disbursed_at = NOW()
      WHERE loan_id = $2 RETURNING *;
    `;
    const loanRes = await client.query(updateLoan, [approvedAmount, loanId]);
    const loan = loanRes.rows[0];

    // 2. Record the 'DISBURSAL' Transaction (Table 5)
    const disbursalTxn = `
      INSERT INTO transactions (loan_id, user_id, amount, txn_type, status, idempotency_key)
      VALUES ($1, $2, $3, 'DISBURSAL', 'SUCCESS', $4);
    `;
    await client.query(disbursalTxn, [
      loanId,
      loan.user_id,
      approvedAmount,
      `DISB-${loanId}`, // Unique key to prevent double disbursement
    ]);

    // 3. Generate Repayment Schedule (Table 6)
    const emi = approvedAmount / loan.tenure_months; // Simplified flat EMI
    for (let i = 1; i <= loan.tenure_months; i++) {
      const dueDate = new Date();
      dueDate.setMonth(dueDate.getMonth() + i);

      await client.query(
        "INSERT INTO repayment_schedules (loan_id, due_date, emi_amount) VALUES ($1, $2, $3)",
        [loanId, dueDate, emi],
      );
    }

    await client.query("COMMIT");
    res.status(200).json({ message: "Loan disbursed and schedule generated." });
  } catch (error) {
    await client.query("ROLLBACK");
    res.status(500).json({ error: error.message });
  } finally {
    client.release();
  }
};
