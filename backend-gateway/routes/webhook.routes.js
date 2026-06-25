import express from "express";
import pool from "../utils/db.js";
import { getPaymentService } from "../services/payment/payment.service.js";
import { logLoanAction, createNotification } from "../utils/audit.js";

const router = express.Router();

router.post("/payment", async (req, res) => {
    const signature = req.headers["x-webhook-signature"] || req.headers["stripe-signature"];
    const payload = JSON.stringify(req.body);

    const paymentService = getPaymentService();
    const isValid = paymentService.verifyWebhookSignature(payload, signature, process.env.WEBHOOK_SECRET);

    if (!isValid) {
        return res.status(401).json({ error: "Invalid Webhook Signature" });
    }

    const { event, orderId, loanId, scheduleId, status } = req.body;

    try {
        if (status === "SUCCESS" || event === "payment.captured") {
            // Idempotent check
            const schedCheck = await pool.query("SELECT status, due_amount FROM repayment_schedules WHERE schedule_id = $1", [scheduleId]);
            if (schedCheck.rows.length > 0 && schedCheck.rows[0].status !== "PAID") {
                await pool.query("UPDATE repayment_schedules SET status = 'PAID', paid_at = NOW() WHERE schedule_id = $1", [scheduleId]);

                // Record transaction
                const userIdRes = await pool.query("SELECT user_id FROM loans WHERE loan_id = $1", [loanId]);
                const userId = userIdRes.rows[0]?.user_id;

                await pool.query(
                    `INSERT INTO transactions (transaction_id, loan_id, amount, type, status, reference_no, timestamp)
                     VALUES ($1, $2, $3, 'EMI_REPAYMENT', 'SUCCESS', $4, NOW()) ON CONFLICT DO NOTHING`,
                    [`tx_wh_${Date.now()}`, loanId, schedCheck.rows[0].due_amount, orderId || `wh_ref_${Date.now()}`]
                );

                if (userId) {
                    await createNotification(pool, userId, "EMI Payment Received", `Your EMI for loan ${loanId} has been marked PAID via Webhook.`);
                    await logLoanAction(pool, loanId, userId, "EMI_REPAYMENT_WEBHOOK", "ACTIVE", "ACTIVE", `Payment captured via webhook ref: ${orderId}`);
                }
            }
        }

        return res.status(200).json({ received: true });
    } catch (err) {
        console.error("Webhook processing error:", err);
        return res.status(500).json({ error: "Internal webhook processing failure" });
    }
});

export default router;
