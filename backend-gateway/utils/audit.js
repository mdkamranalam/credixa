import logger from "./logger.js";

/**
 * Utility to log loan status transitions or administrative actions.
 * @param {object} client - The pg pool or client (in a transaction)
 * @param {string} loanId - The UUID of the loan
 * @param {string} actorUserId - The UUID of the user performing the action
 * @param {string} action - Describe the action (e.g. 'STATUS_CHANGE', 'REPAYMENT')
 * @param {string} oldStatus - The previous status, if applicable
 * @param {string} newStatus - The new status
 * @param {string} notes - Optional reasoning or metadata
 */
export const logLoanAction = async (client, loanId, actorUserId, action, oldStatus, newStatus, notes = "") => {
  try {
    await client.query(
      `INSERT INTO audit_logs (loan_id, actor_user_id, action, old_status, new_status, notes)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [loanId, actorUserId, action, oldStatus, newStatus, notes]
    );
  } catch (err) {
    logger.error(`Failed to log audit action for loan ${loanId}:`, err);
  }
};

/**
 * Utility to send an in-app notification to a user.
 * @param {object} client - The pg pool or client
 * @param {string} userId - The target user UUID
 * @param {string} title - The short title of the notification
 * @param {string} message - Detailed message body
 */
export const createNotification = async (client, userId, title, message) => {
  try {
    await client.query(
      `INSERT INTO notifications (user_id, title, message) VALUES ($1, $2, $3)`,
      [userId, title, message]
    );
  } catch (err) {
    logger.error(`Failed to create notification for user ${userId}:`, err);
  }
};
