import express from "express";
import pool from "../utils/db.js";
import { authenticateToken } from "../middleware/auth.middleware.js";

const router = express.Router();

// Get all notifications for the authenticated user
router.get("/", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id || req.user.user_id;
    const query = `
      SELECT notification_id, title, message, is_read, created_at 
      FROM notifications 
      WHERE user_id = $1 
      ORDER BY created_at DESC 
      LIMIT 50;
    `;
    const result = await pool.query(query, [userId]);
    res.status(200).json(result.rows);
  } catch (err) {
    console.error("Fetch Notifications Error:", err.message);
    res.status(500).json({ error: "Failed to load notifications." });
  }
});

// Mark a notification as read
router.put("/:id/read", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id || req.user.user_id;
    const { id } = req.params;
    const query = `
      UPDATE notifications 
      SET is_read = TRUE 
      WHERE notification_id = $1 AND user_id = $2 
      RETURNING *;
    `;
    const result = await pool.query(query, [id, userId]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Notification not found or unauthorized." });
    }
    res.status(200).json({ message: "Notification marked as read." });
  } catch (err) {
    console.error("Mark Notification Read Error:", err.message);
    res.status(500).json({ error: "Failed to mark notification as read." });
  }
});

// Mark all as read
router.put("/read-all", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id || req.user.user_id;
    await pool.query("UPDATE notifications SET is_read = TRUE WHERE user_id = $1 AND is_read = FALSE", [userId]);
    res.status(200).json({ message: "All notifications marked as read." });
  } catch (err) {
    res.status(500).json({ error: "Failed to mark all as read." });
  }
});

export default router;
