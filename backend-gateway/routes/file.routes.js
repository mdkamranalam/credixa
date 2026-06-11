import express from "express";
import path from "path";
import fs from "fs";
import { authenticateToken } from "../middleware/auth.middleware.js";

const router = express.Router();

// Authenticated endpoint to view or download uploaded documents
router.get("/:subfolder/:filename", authenticateToken, (req, res) => {
    const { subfolder, filename } = req.params;
    
    // Validate subfolder to prevent directory traversal
    if (subfolder !== "loan_docs") {
        return res.status(403).json({ error: "Access denied to this folder" });
    }

    // Safely construct file path
    const safeFilename = path.basename(filename);
    const filePath = path.join(process.cwd(), "uploads", subfolder, safeFilename);

    if (fs.existsSync(filePath)) {
        res.sendFile(filePath);
    } else {
        res.status(404).json({ error: "File not found" });
    }
});

export default router;
