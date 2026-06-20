import express from "express";
import path from "path";
import fs from "fs";
import { authenticateToken } from "../middleware/auth.middleware.js";
import pool from "../utils/db.js";

const router = express.Router();

router.get("/:subfolder/:filename", authenticateToken, async (req, res) => {
    const { subfolder, filename } = req.params;
    const userId = req.user.id || req.user.user_id;
    const userRole = req.user.role;
    
    // Validate subfolder to prevent directory traversal
    if (subfolder !== "loan_docs") {
        return res.status(403).json({ error: "Access denied to this folder" });
    }

    // Safely construct file path
    const safeFilename = path.basename(filename);
    const relativePath = `${subfolder}/${safeFilename}`;
    const filePath = path.join(process.cwd(), "uploads", subfolder, safeFilename);

    try {
        // Enforce ownership: only the uploader or an institution admin can view it
        if (userRole !== "INSTITUTION_ADMIN") {
            const checkQuery = `SELECT doc_id FROM loan_documents WHERE user_id = $1 AND file_url LIKE $2`;
            const checkResult = await pool.query(checkQuery, [userId, `%${safeFilename}%`]);
            if (checkResult.rows.length === 0) {
                return res.status(403).json({ error: "Access denied: You do not own this document." });
            }
        }
        
        if (fs.existsSync(filePath)) {
            res.sendFile(filePath);
        } else {
            res.status(404).json({ error: "File not found" });
        }
    } catch (err) {
        console.error("File ownership verification error:", err);
        res.status(500).json({ error: "Internal server error" });
    }
});

export default router;
