import pool from "../utils/db.js";
import { broadcastEvent } from "../utils/sseManager.js";
import { createNotification } from "../utils/audit.js";

// CREATE a new support ticket
export const createTicket = async (req, res) => {
    const userId = req.user.id || req.user.user_id;
    const role = req.user.role; // typically STUDENT
    const { subject, category, message } = req.body;

    if (!subject || !message) {
        return res.status(400).json({ error: "Subject and message are required." });
    }

    const client = await pool.connect();
    try {
        await client.query("BEGIN");

        // 1. Get student's institution_id
        const userRes = await client.query("SELECT institution_id FROM users WHERE user_id = $1", [userId]);
        if (userRes.rows.length === 0) {
            throw new Error("User not found.");
        }
        const institutionId = userRes.rows[0].institution_id;

        // 2. Create the ticket
        const ticketRes = await client.query(
            `INSERT INTO support_tickets (user_id, institution_id, subject, category) 
             VALUES ($1, $2, $3, $4) RETURNING *`,
            [userId, institutionId, subject, category || 'GENERAL']
        );
        const ticket = ticketRes.rows[0];

        // 3. Insert the first message
        const messageRes = await client.query(
            `INSERT INTO support_messages (ticket_id, sender_id, sender_role, body)
             VALUES ($1, $2, $3, $4) RETURNING *`,
            [ticket.ticket_id, userId, role, message]
        );
        const newMessage = messageRes.rows[0];

        await client.query("COMMIT");

        // We can notify the admins of that institution via SSE, but for now we just return
        res.status(201).json({ ticket, message: newMessage });
    } catch (error) {
        await client.query("ROLLBACK");
        console.error("Create Ticket Error:", error);
        res.status(500).json({ error: "Failed to create support ticket." });
    } finally {
        client.release();
    }
};

// GET all tickets for a user (Student)
export const getMyTickets = async (req, res) => {
    const userId = req.user.id || req.user.user_id;
    
    try {
        const result = await pool.query(
            `SELECT t.*, 
            (SELECT COUNT(*) FROM support_messages m WHERE m.ticket_id = t.ticket_id AND m.is_read = FALSE AND m.sender_role != $1) as unread_count
            FROM support_tickets t WHERE t.user_id = $2 ORDER BY t.updated_at DESC`,
            [req.user.role, userId]
        );
        res.status(200).json(result.rows);
    } catch (error) {
        console.error("Get My Tickets Error:", error);
        res.status(500).json({ error: "Failed to fetch tickets." });
    }
};

// GET all tickets for an institution (Admin)
export const getAdminTickets = async (req, res) => {
    const institutionId = req.user.institution_id;
    if (!institutionId) {
        return res.status(403).json({ error: "Unauthorized. Admin must belong to an institution." });
    }

    try {
        const result = await pool.query(
            `SELECT t.*, u.full_name as student_name,
            (SELECT COUNT(*) FROM support_messages m WHERE m.ticket_id = t.ticket_id AND m.is_read = FALSE AND m.sender_role != $1) as unread_count
            FROM support_tickets t 
            JOIN users u ON t.user_id = u.user_id
            WHERE t.institution_id = $2 
            ORDER BY t.updated_at DESC`,
            [req.user.role, institutionId]
        );
        res.status(200).json(result.rows);
    } catch (error) {
        console.error("Get Admin Tickets Error:", error);
        res.status(500).json({ error: "Failed to fetch institution tickets." });
    }
};

// GET a single ticket with its messages
export const getTicketDetails = async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id || req.user.user_id;
    const role = req.user.role;

    try {
        // First check authorization
        const ticketRes = await pool.query("SELECT * FROM support_tickets WHERE ticket_id = $1", [id]);
        if (ticketRes.rows.length === 0) return res.status(404).json({ error: "Ticket not found." });
        
        const ticket = ticketRes.rows[0];

        // Access control
        if (role === 'STUDENT' && ticket.user_id !== userId) {
            return res.status(403).json({ error: "Access denied." });
        }
        if (role === 'INSTITUTION_ADMIN' && ticket.institution_id !== req.user.institution_id) {
            return res.status(403).json({ error: "Access denied." });
        }

        // Mark messages as read
        await pool.query(
            "UPDATE support_messages SET is_read = TRUE WHERE ticket_id = $1 AND sender_role != $2",
            [id, role]
        );

        // Fetch messages
        const messagesRes = await pool.query(
            "SELECT * FROM support_messages WHERE ticket_id = $1 ORDER BY created_at ASC",
            [id]
        );

        res.status(200).json({ ticket, messages: messagesRes.rows });
    } catch (error) {
        console.error("Get Ticket Details Error:", error);
        res.status(500).json({ error: "Failed to fetch ticket details." });
    }
};

// SEND a message in an existing ticket
export const sendMessage = async (req, res) => {
    const { id } = req.params;
    const { message } = req.body;
    const userId = req.user.id || req.user.user_id;
    const role = req.user.role;

    if (!message) return res.status(400).json({ error: "Message is required." });

    const client = await pool.connect();
    try {
        await client.query("BEGIN");

        const ticketRes = await client.query("SELECT * FROM support_tickets WHERE ticket_id = $1 FOR UPDATE", [id]);
        if (ticketRes.rows.length === 0) throw new Error("Ticket not found.");
        const ticket = ticketRes.rows[0];

        // Access control
        if (role === 'STUDENT' && ticket.user_id !== userId) throw new Error("Access denied.");
        if (role === 'INSTITUTION_ADMIN' && ticket.institution_id !== req.user.institution_id) throw new Error("Access denied.");

        const msgRes = await client.query(
            `INSERT INTO support_messages (ticket_id, sender_id, sender_role, body)
             VALUES ($1, $2, $3, $4) RETURNING *`,
            [id, userId, role, message]
        );
        const newMessage = msgRes.rows[0];

        await client.query("UPDATE support_tickets SET updated_at = CURRENT_TIMESTAMP WHERE ticket_id = $1", [id]);
        await client.query("COMMIT");

        // Notify the other party via SSE
        const recipientId = role === 'STUDENT' ? null : ticket.user_id; 
        // We only notify the student via personal SSE. We don't have a reliable way to broadcast to ALL admins of an inst via SSE easily without iterating.
        if (recipientId) {
            broadcastEvent(recipientId, "SUPPORT_MESSAGE", { ticket_id: id, message: newMessage });
        }

        res.status(201).json(newMessage);
    } catch (error) {
        await client.query("ROLLBACK");
        console.error("Send Message Error:", error);
        res.status(500).json({ error: error.message || "Failed to send message." });
    } finally {
        client.release();
    }
};

// UPDATE ticket status (Admin only)
export const updateTicketStatus = async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    const role = req.user.role;

    if (role !== 'INSTITUTION_ADMIN') return res.status(403).json({ error: "Only admins can update ticket status." });
    if (!status) return res.status(400).json({ error: "Status is required." });

    try {
        const ticketRes = await pool.query(
            "UPDATE support_tickets SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE ticket_id = $2 AND institution_id = $3 RETURNING *",
            [status, id, req.user.institution_id]
        );

        if (ticketRes.rows.length === 0) {
            return res.status(404).json({ error: "Ticket not found or access denied." });
        }

        const ticket = ticketRes.rows[0];

        // Notify student of status change
        await createNotification(
            pool, 
            ticket.user_id, 
            "Support Ticket Updated", 
            `Your support ticket "${ticket.subject}" is now ${status}.`
        );
        broadcastEvent(ticket.user_id, "SUPPORT_TICKET_UPDATE", ticket);

        res.status(200).json(ticket);
    } catch (error) {
        console.error("Update Ticket Status Error:", error);
        res.status(500).json({ error: "Failed to update ticket status." });
    }
};
