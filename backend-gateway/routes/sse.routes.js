import express from "express";
import { authenticateToken } from "../middleware/auth.middleware.js";
import { addSSEClient } from "../utils/sseManager.js";

const router = express.Router();

router.get("/events", authenticateToken, (req, res) => {
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no"); // Disable nginx proxy buffering

    res.flushHeaders();

    const userId = req.user.id || req.user.user_id;
    addSSEClient(userId, res);

    // Send initial handshake
    res.write("event: CONNECTED\n");
    res.write(`data: ${JSON.stringify({ status: "SSE connection established", userId })}\n\n`);

    // Keepalive ping every 30s
    const keepalive = setInterval(() => {
        try {
            res.write(": keepalive\n\n");
        } catch (e) {
            clearInterval(keepalive);
        }
    }, 30000);

    res.on("close", () => {
        clearInterval(keepalive);
    });
});

export default router;
