import pool from "../utils/db.js";

export const approveAndDisburse = async (req, res) => {
  const { loanId, approvedAmount } = req.body;
  const client = await pool.connect();

  try {
    // Input validation
    if (!loanId || typeof loanId !== 'string' || loanId.trim() === '') {
      return res.status(400).json({ error: "Valid loan ID is required." });
    }

    // Sanitize loan ID - remove any potentially dangerous characters
    const sanitizedLoanId = loanId.trim().replace(/[^a-zA-Z0-9\-_]/g, '');
    if (sanitizedLoanId !== loanId) {
      return res.status(400).json({ error: "Invalid loan ID format." });
    }

    if (approvedAmount === undefined || approvedAmount === null || isNaN(approvedAmount) || approvedAmount <= 0) {
      return res.status(400).json({ error: "Valid approved amount (positive number) is required." });
    }

    // Additional security checks
    if (!req.user || !req.user.institution_id) {
      return res.status(403).json({ error: "Unauthorized access." });
    }

    await client.query("BEGIN");

    // Check if loan has already been disbursed
    const checkDisbursement = `
      SELECT status, disbursed_at, institution_id, user_id, interest_rate, tenure_months FROM loans WHERE loan_id = $1 AND institution_id = $2;
    `;
    const checkRes = await client.query(checkDisbursement, [sanitizedLoanId, req.user.institution_id]);

    if (checkRes.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Loan not found or unauthorized." });
    }

    const existingLoan = checkRes.rows[0];
    if (existingLoan.disbursed_at) {
      await client.query("ROLLBACK");
      return res.status(400).json({ error: "Loan has already been disbursed." });
    }

    // 1. Update Loan to 'ACTIVE' and set 'disbursed_at'
    const updateLoan = `
      UPDATE loans
      SET status = 'ACTIVE', approved_amount = $1, disbursed_at = NOW()
      WHERE loan_id = $2 RETURNING *;
    `;
    const loanRes = await client.query(updateLoan, [approvedAmount, sanitizedLoanId]);
    const loan = loanRes.rows[0];

    // Check if loan was found and belongs to the institution
    if (!loan) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Loan not found." });
    }

    // Verify loan belongs to the institution of the admin
    if (loan.institution_id !== req.user.institution_id) {
      await client.query("ROLLBACK");
      return res.status(403).json({ error: "Unauthorized access to this loan." });
    }

    // Validate that the loan has required fields for EMI calculation
    if (loan.interest_rate === undefined || loan.interest_rate === null) {
      await client.query("ROLLBACK");
      return res.status(400).json({ error: "Loan interest rate not found." });
    }

    if (loan.tenure_months === undefined || loan.tenure_months === null || loan.tenure_months <= 0) {
      await client.query("ROLLBACK");
      return res.status(400).json({ error: "Loan tenure months not found or invalid." });
    }

    // 2. Record the 'DISBURSAL' Transaction (Table 5)
    const disbursalTxn = `
      INSERT INTO transactions (loan_id, user_id, amount, txn_type, status, idempotency_key)
      VALUES ($1, $2, $3, 'DISBURSAL', 'SUCCESS', $4);
    `;
    await client.query(disbursalTxn, [
      sanitizedLoanId,
      loan.user_id,
      approvedAmount,
      `DISB-${sanitizedLoanId}`, // Unique key to prevent double disbursement
    ]);

    // 3. Generate Repayment Schedule (Table 6)
    // Calculate EMI using standard formula: EMI = P * r * (1 + r)^n / ((1 + r)^n - 1)
    // where P = principal, r = monthly interest rate, n = number of months
    const monthlyInterestRate = (loan.interest_rate / 100) / 12;
    const numberOfPayments = loan.tenure_months;

    // Handle case where interest rate is 0 to avoid division by zero
    let emi;
    if (monthlyInterestRate === 0) {
        emi = approvedAmount / numberOfPayments;
    } else {
        emi = (approvedAmount * monthlyInterestRate * Math.pow(1 + monthlyInterestRate, numberOfPayments)) /
              (Math.pow(1 + monthlyInterestRate, numberOfPayments) - 1);
    }
    for (let i = 1; i <= loan.tenure_months; i++) {
      const dueDate = new Date();
      dueDate.setMonth(dueDate.getMonth() + i);

      await client.query(
        "INSERT INTO repayment_schedules (loan_id, due_date, emi_amount) VALUES ($1, $2, $3)",
        [sanitizedLoanId, dueDate, emi],
      );
    }

    await client.query("COMMIT");
    res.status(200).json({ message: "Loan disbursed and schedule generated." });
  } catch (error) {
    await client.query("ROLLBACK");
    // Don't expose internal error details to client
    res.status(500).json({ error: "Internal server error occurred during loan disbursement." });
  } finally {
    client.release();
  }
};
