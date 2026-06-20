import cron from "node-cron";
import pool from "../utils/db.js";
import logger from "../utils/logger.js";
import { logLoanAction, createNotification } from "../utils/audit.js";

const LATE_FEE_AMOUNT = 500.00; // Flat late fee example
const MAX_MISSED_PAYMENTS = 3;

/**
 * Scheduled job to process overdue loans and trigger defaults.
 * Runs every day at 1:00 AM server time.
 */
export const startLoanScheduler = () => {
  logger.info("Initializing loan scheduler cron job...");

  cron.schedule("0 1 * * *", async () => {
    logger.info("Running daily overdue loan check...");
    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      // 1. Find all pending repayment schedules whose due date has passed
      const overdueQuery = `
        SELECT schedule_id, loan_id, emi_amount, due_date
        FROM repayment_schedules
        WHERE status = 'PENDING' AND due_date < CURRENT_DATE;
      `;
      const overdueResult = await client.query(overdueQuery);

      for (const schedule of overdueResult.rows) {
        // Mark schedule as OVERDUE
        await client.query(
          "UPDATE repayment_schedules SET status = 'OVERDUE' WHERE schedule_id = $1",
          [schedule.schedule_id]
        );

        // Fetch loan user to send notification
        const loanRes = await client.query("SELECT user_id FROM loans WHERE loan_id = $1", [schedule.loan_id]);
        if (loanRes.rows.length > 0) {
          const userId = loanRes.rows[0].user_id;
          
          // Apply a late fee transaction
          await client.query(
            `INSERT INTO transactions (loan_id, user_id, amount, txn_type, status)
             VALUES ($1, $2, $3, 'LATE_FEE', 'SUCCESS')`,
            [schedule.loan_id, userId, LATE_FEE_AMOUNT]
          );

          await createNotification(
            client,
            userId,
            "EMI Overdue",
            `Your EMI payment of ₹${schedule.emi_amount} due on ${new Date(schedule.due_date).toLocaleDateString()} is overdue. A late fee has been applied.`
          );

          await logLoanAction(client, schedule.loan_id, null, "OVERDUE_EMI_FLAGGED", "PENDING", "OVERDUE", `Missed schedule ID: ${schedule.schedule_id}`);
        }
      }

      // 2. Escalate loans to DEFAULTED if they have > N overdue payments
      const defaultQuery = `
        SELECT loan_id, COUNT(*) as overdue_count
        FROM repayment_schedules
        WHERE status = 'OVERDUE'
        GROUP BY loan_id
        HAVING COUNT(*) >= $1;
      `;
      const defaultResult = await client.query(defaultQuery, [MAX_MISSED_PAYMENTS]);

      for (const def of defaultResult.rows) {
        // Check if it's already defaulted
        const loanCheck = await client.query("SELECT status, user_id FROM loans WHERE loan_id = $1", [def.loan_id]);
        if (loanCheck.rows.length > 0 && loanCheck.rows[0].status !== 'DEFAULTED') {
          await client.query("UPDATE loans SET status = 'DEFAULTED', updated_at = NOW() WHERE loan_id = $1", [def.loan_id]);
          
          const userId = loanCheck.rows[0].user_id;
          await createNotification(
            client,
            userId,
            "Loan Defaulted",
            `Your loan has been marked as DEFAULTED due to multiple consecutive missed payments. Immediate action is required.`
          );

          await logLoanAction(client, def.loan_id, null, "LOAN_DEFAULTED", loanCheck.rows[0].status, "DEFAULTED", `Defaulted after ${def.overdue_count} missed payments.`);
        }
      }

      await client.query("COMMIT");
      logger.info(`Completed overdue check. Flagged ${overdueResult.rows.length} overdue EMIs and ${defaultResult.rows.length} defaulted loans.`);
    } catch (err) {
      await client.query("ROLLBACK");
      logger.error("Error in daily overdue loan check:", err);
    } finally {
      client.release();
    }
  });
};
