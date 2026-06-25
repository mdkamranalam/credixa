import logger from "./logger.js";
import { broadcastEvent, broadcastGlobalEvent } from "./sseManager.js";

/**
 * Utility to log loan status transitions or administrative actions.
 */
export const logLoanAction = async (client, loanId, actorUserId, action, oldStatus, newStatus, notes = "") => {
  try {
    await client.query(
      `INSERT INTO audit_logs (loan_id, actor_user_id, action, old_status, new_status, notes)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [loanId, actorUserId, action, oldStatus, newStatus, notes]
    );
    broadcastGlobalEvent("LOAN_STATUS_UPDATE", { loanId, actorUserId, action, oldStatus, newStatus });
  } catch (err) {
    logger.error(`Failed to log audit action for loan ${loanId}:`, err);
  }
};

/**
 * Utility to send an in-app notification to a user.
 */
export const createNotification = async (client, userId, title, message) => {
  try {
    await client.query(
      `INSERT INTO notifications (user_id, title, message) VALUES ($1, $2, $3)`,
      [userId, title, message]
    );
    broadcastEvent(userId, "NOTIFICATION", { title, message });
  } catch (err) {
    logger.error(`Failed to create notification for user ${userId}:`, err);
  }
};
