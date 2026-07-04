import express from "express";
import pool from "../utils/db.js";
import dotenv from "dotenv";
import { authenticateToken } from "../middleware/auth.middleware.js";
import { upload as diskUpload } from "../middleware/upload.middleware.js";
import { encryptData, decryptData, hmacData } from "../utils/encryption.js";
import axios from "axios";
import FormData from "form-data";
import { createReadStream, unlinkSync } from "fs";

dotenv.config();
const router = express.Router();
router.get("/profile", authenticateToken, async (req, res) => {
  const userId = req.user.id;

  try {
    const profileQuery = `
            SELECT 
                u.full_name, 
                u.email, 
                u.mobile_number, 
                u.pan_number, 
                u.aadhaar_hash,
                u.college_roll_number, 
                u.kyc_status,
                u.pre_approval_score,
                u.analysis_reasoning,
                u.analysis_highlights,
                i.name AS college_name 
            FROM users u
            LEFT JOIN institutions i ON u.institution_id = i.institution_id
            WHERE u.user_id = $1;
        `;

    const result = await pool.query(profileQuery, [userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "User profile not found." });
    }

    const [docsRes, coAppRes] = await Promise.all([
      pool.query(
        "SELECT doc_id, category, doc_type, is_verified, file_url, extracted_text, structured_details FROM loan_documents WHERE user_id = $1",
        [userId]
      ),
      pool.query("SELECT * FROM co_applicants WHERE user_id = $1 LIMIT 1", [
        userId,
      ]),
    ]);

    const userProfile = result.rows[0];
    
    if (userProfile.aadhaar_hash) {
      try {
        userProfile.aadhaar_number = decryptData(userProfile.aadhaar_hash);
      } catch (e) {
        userProfile.aadhaar_number = "Decryption Failed";
      }
      delete userProfile.aadhaar_hash;
    } else {
      userProfile.aadhaar_number = "Not Provided";
    }

    const coApp = coAppRes.rows[0] || null;
    if (coApp) {
      if (coApp.aadhaar_number && coApp.aadhaar_number.includes(':')) {
        try {
          coApp.aadhaar_number = decryptData(coApp.aadhaar_number);
        } catch (e) {
          coApp.aadhaar_number = "Decryption Failed";
        }
      } else if (!coApp.aadhaar_number) {
        coApp.aadhaar_number = "Not Provided";
      }
      
      if (coApp.pan_number && coApp.pan_number.includes(':')) {
        try {
          coApp.pan_number = decryptData(coApp.pan_number);
        } catch (e) {
          coApp.pan_number = "Decryption Failed";
        }
      } else if (!coApp.pan_number) {
        coApp.pan_number = "Not Provided";
      }
    }

    userProfile.documents = docsRes.rows;
    userProfile.co_applicant = coApp;

    res.status(200).json(userProfile);
  } catch (error) {
    console.error("Profile Fetch Error:", error.message);
    res.status(500).json({ error: "Failed to fetch profile." });
  }
});

// Step 2: Identity Verification (KYC)
router.post("/kyc", authenticateToken, async (req, res) => {
  const userId = req.user.id;
  const { pan_number, aadhaar_number } = req.body;

  if (!pan_number || !aadhaar_number) {
    return res.status(400).json({ error: "PAN and Aadhaar numbers are required." });
  }

  // Simulate IndiaStack API latency (50ms)
  await new Promise((resolve) => setTimeout(resolve, 50));

  try {
    // Compute a deterministic HMAC for O(1) indexed deduplication.
    // This avoids fetching and decrypting every row in the users table.
    const aadhaarHmac = hmacData(aadhaar_number);

    // Single indexed query — no full table scan
    const duplicateCheck = await pool.query(
      "SELECT user_id FROM users WHERE aadhaar_hmac = $1 AND user_id != $2",
      [aadhaarHmac, userId]
    );
    if (duplicateCheck.rows.length > 0) {
      return res.status(400).json({ error: "Aadhaar already linked to another account." });
    }

    const aadhaarHash = encryptData(aadhaar_number);

    const updateQuery = `
      UPDATE users 
      SET kyc_status = 'VERIFIED', kyc_source = 'INDIASTACK_SIMULATION', pan_number = $1,
          aadhaar_hash = $2, aadhaar_hmac = $3, updated_at = NOW()
      WHERE user_id = $4
      RETURNING user_id, kyc_status, pan_number;
    `;
    const result = await pool.query(updateQuery, [pan_number, aadhaarHash, aadhaarHmac, userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "User not found." });
    }

    res.status(200).json({ message: "KYC Verified successfully", user: result.rows[0] });
  } catch (error) {
    console.error("KYC Verification Error:", error.message);
    if (error.code === '23505') {
       return res.status(400).json({ error: "PAN or Aadhaar already linked to another account." });
    }
    // Handle check constraint failure for PAN
    if (error.code === '23514') {
       return res.status(400).json({ error: "Invalid PAN format. Must be 5 letters, 4 digits, 1 letter." });
    }
    res.status(500).json({ error: "Failed to verify KYC." });
  }
});

// Upload a static KYC/Academic document persistently attached to the user
router.post(
  "/documents",
  authenticateToken,
  diskUpload.single("file"),
  async (req, res) => {
    const userId = req.user.id;
    const { owner_type, category, doc_type, use_ocr } = req.body;

    if (!req.file) return res.status(400).json({ error: "No file uploaded." });
    if (!owner_type || !category || !doc_type) {
      return res.status(400).json({ error: "Missing document metadata." });
    }

    const file_url = req.file.path;

    try {
      // Create FormData to send file to risk engine
      const formData = new FormData();
      formData.append("doc_type", doc_type);
      formData.append("file", createReadStream(req.file.path));

      const riskEngineBase = process.env.RISK_ENGINE_BASE_URL || "https://credixa-risk-engine.onrender.com";
      const riskEngineUrl = `${riskEngineBase}/validate-document`;

      // Fetch expected name based on owner_type for matching
      let expectedName = "";
      if (owner_type === "STUDENT") {
        const userRes = await pool.query("SELECT full_name FROM users WHERE user_id = $1", [userId]);
        expectedName = userRes.rows[0]?.full_name;
      } else {
        const coAppRes = await pool.query("SELECT full_name FROM co_applicants WHERE user_id = $1", [userId]);
        expectedName = coAppRes.rows[0]?.full_name;
      }

      let extracted_text = null;
      let structured_details = null;
      let is_verified = false;

      try {
        const ocrQuery = use_ocr === 'true' || use_ocr === true ? '&use_ocr=true' : '';
        const riskResponse = await axios.post(`${riskEngineUrl}?expected_name=${encodeURIComponent(expectedName)}${ocrQuery}`, formData, {
          headers: {
            ...formData.getHeaders(),
            "x-api-key": process.env.RISK_ENGINE_API_KEY || "credixa_internal_engine_key_2026",
          },
        });

        if (riskResponse.data && !riskResponse.data.valid) {
          unlinkSync(req.file.path); // remove invalid file
          return res.status(400).json({ error: riskResponse.data.message });
        }

        extracted_text = riskResponse.data?.extracted_text;
        structured_details = riskResponse.data?.structured_details;
        is_verified = true;
      } catch (riskError) {
        console.error("Risk engine validation failed or unavailable:", riskError.message);
        unlinkSync(req.file.path);
        return res.status(400).json({ error: "Failed to validate document. Ensure the file is a readable PDF." });
      }

      const insertQuery = `
        INSERT INTO loan_documents (user_id, owner_type, category, doc_type, file_url, extracted_text, structured_details, is_verified)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *;
      `;
      const result = await pool.query(insertQuery, [
        userId,
        owner_type,
        category,
        doc_type,
        file_url,
        extracted_text,
        JSON.stringify(structured_details),
        is_verified
      ]);
      res.status(201).json({
        message: "Document uploaded successfully",
        document: result.rows[0],
      });
    } catch (error) {
      console.error("User doc upload error:", error);
      res.status(500).json({ error: "Failed to save document." });
    }
  }
);

// Save or Update the User's permanent Co-Applicant
router.post("/co-applicant", authenticateToken, async (req, res) => {
  const userId = req.user.id;
  const {
    full_name,
    relationship,
    aadhaar_number,
    pan_number,
    income_type,
    monthly_income,
  } = req.body;

  if (!full_name || !relationship || !pan_number) {
    return res.status(400).json({ error: "Missing required details." });
  }

  try {
    // 1. Fetch student's PAN and Aadhaar
    const studentRes = await pool.query("SELECT pan_number, aadhaar_hash FROM users WHERE user_id = $1", [userId]);
    const student = studentRes.rows[0];
    
    if (student) {
        if (student.pan_number === pan_number) {
            return res.status(400).json({ error: "Co-applicant PAN cannot be the same as the student's PAN." });
        }
        if (student.aadhaar_hash && aadhaar_number) {
            try {
                const decryptedStudentAadhaar = decryptData(student.aadhaar_hash);
                if (decryptedStudentAadhaar === aadhaar_number) {
                    return res.status(400).json({ error: "Co-applicant Aadhaar cannot be the same as the student's Aadhaar." });
                }
            } catch (e) {}
        }
    }

    const encryptedAadhaar = aadhaar_number ? encryptData(aadhaar_number) : null;

    // We use a simple SELECT then INSERT/UPDATE because `user_id` might not be strictly UNIQUE on co_applicants in all setups
    // But conceptually, one student = one co_applicant (for the prototype)
    const existing = await pool.query(
      "SELECT * FROM co_applicants WHERE user_id = $1",
      [userId]
    );

    let result;
    if (existing.rows.length > 0) {
      const updateQuery = `
          UPDATE co_applicants 
          SET full_name = $1, relationship = $2, aadhaar_number = $3, pan_number = $4, income_type = $5, monthly_income = $6, updated_at = NOW()
          WHERE user_id = $7
          RETURNING *;
        `;
      const updateRes = await pool.query(updateQuery, [
        full_name,
        relationship,
        encryptedAadhaar,
        pan_number,
        income_type,
        monthly_income || 0,
        userId,
      ]);
      result = updateRes.rows[0];
    } else {
      const insertQuery = `
          INSERT INTO co_applicants (user_id, full_name, relationship, aadhaar_number, pan_number, income_type, monthly_income)
          VALUES ($1, $2, $3, $4, $5, $6, $7)
          RETURNING *;
        `;
      const insertRes = await pool.query(insertQuery, [
        userId,
        full_name,
        relationship,
        encryptedAadhaar,
        pan_number,
        income_type,
        monthly_income || 0,
      ]);
      result = insertRes.rows[0];
    }

    res.status(201).json({
      message: "Co-applicant saved successfully",
      co_applicant: result,
    });
  } catch (error) {
    console.error("Co-applicant error:", error);
    if (error.code === "23505") {
      return res.status(400).json({
        error: "Aadhaar or PAN already exists for another active application.",
      });
    }
    res.status(500).json({ error: "Failed to save co-applicant." });
  }
});

// Update User's Academic Details
router.post("/academic-details", authenticateToken, async (req, res) => {
  const userId = req.user.id;
  const { current_semester_marks } = req.body;

  try {
    const updateQuery = `
      UPDATE users 
      SET current_semester_marks = $1, updated_at = NOW()
      WHERE user_id = $2
      RETURNING *;
    `;
    const updateRes = await pool.query(updateQuery, [
      current_semester_marks || null,
      userId,
    ]);

    if (updateRes.rows.length === 0) {
      return res.status(404).json({ error: "User not found." });
    }

    res.status(200).json({
      message: "Academic details updated successfully",
      user: updateRes.rows[0],
    });
  } catch (error) {
    console.error("Academic details update error:", error);
    res.status(500).json({ error: "Failed to update academic details." });
  }
});

router.post("/run-analysis", authenticateToken, async (req, res) => {
  const userId = req.user.id;
  try {
    const docsRes = await pool.query(
      "SELECT category, doc_type, is_verified, structured_details FROM loan_documents WHERE user_id = $1",
      [userId]
    );

    const docs = docsRes.rows;
    let score = 0;
    let pros = [];
    let cons = [];

    // 1. Identity & KYC Readiness (Base 30 points)
    score += 30;
    pros.push("Identity (PAN/Aadhaar) successfully verified (30/30 pts).");

    if (docs.length === 0) {
      return res.status(400).json({ error: "No documents found for analysis." });
    }

    // 2. Document Extraction Quality (30 points max)
    let extractionScore = 0;
    let validDocs = 0;
    let hasFinancialData = false;
    let marksPercentage = null;
    let riskKeywords = 0;

    docs.forEach(doc => {
      if (doc.is_verified) {
        validDocs++;
        let details = typeof doc.structured_details === 'string' ? JSON.parse(doc.structured_details) : doc.structured_details;
        
        const typeLower = (doc.doc_type || "").toLowerCase();
        if (doc.category === "FINANCIAL" || typeLower.includes("statement") || typeLower.includes("ledger") || (details && (details["Average Balance"] !== undefined || details["verification"] !== undefined))) {
          hasFinancialData = true;
        }
        
        if (details && Object.keys(details).length > 0 && !Object.values(details).includes("Not Found")) {
          extractionScore += (30 / docs.length);
          
          if (details["Risk Keywords Found"] && details["Risk Keywords Found"] > 0) {
            riskKeywords += parseInt(details["Risk Keywords Found"]);
          }
          
          if (details["Extracted Marks/Score"]) {
            const marksStr = String(details["Extracted Marks/Score"]);
            if (!isNaN(parseFloat(marksStr))) {
              const marks = parseFloat(marksStr);
              marksPercentage = marks <= 10 ? marks * 10 : marks; 
            }
          }
        } else {
          extractionScore += (15 / docs.length); // Partial points for unreadable docs
          cons.push(`Extraction for ${doc.doc_type.replace(/_/g, ' ')} was partial. Quality (-${Math.round(15/docs.length)} pts).`);
        }
      }
    });

    score += extractionScore;
    if (extractionScore > 25) {
      pros.push(`Excellent document readability (${Math.round(extractionScore)}/30 pts).`);
    } else {
      cons.push(`Average document readability (${Math.round(extractionScore)}/30 pts).`);
    }

    // 3. Financial & Academic Health (40 points max)
    let healthScore = 40;
    
    if (hasFinancialData) {
      pros.push("Financial statements successfully parsed for underwriting.");
    } else {
      healthScore -= 10;
      cons.push("Missing core financial liquidity data (-10 pts).");
    }

    if (riskKeywords > 0) {
      const penalty = Math.min(20, riskKeywords * 5);
      healthScore -= penalty;
      cons.push(`Detected ${riskKeywords} high-risk keyword(s) in statements (-${penalty} pts).`);
    }

    if (marksPercentage !== null) {
      if (marksPercentage < 60) {
        healthScore -= 15;
        cons.push(`Academic risk: Low scores detected (${marksPercentage}%) (-15 pts).`);
      } else {
        pros.push(`Strong academic standing (${marksPercentage}%).`);
      }
    } else {
      // Missing academic data
      healthScore -= 5;
    }

    score += healthScore;
    
    const finalScore = Math.max(0, Math.min(Math.round(score), 100));
    let reasoning = "";

    if (finalScore >= 85) {
      reasoning = "Excellent Profile Readiness: Your documents have been successfully parsed and no immediate risk flags were detected. You are fully ready to apply for a loan.";
    } else if (finalScore >= 65) {
      reasoning = "Good Profile Readiness: Most of your documents were digitized. Minor risks or manual verifications might be required during loan processing.";
    } else {
      reasoning = "Action Recommended: We detected potential risks in your academic/financial profile, or several documents could not be fully parsed. Expect higher scrutiny.";
    }

    await pool.query(
      "UPDATE users SET pre_approval_score = $1, analysis_reasoning = $2, analysis_highlights = $3 WHERE user_id = $4",
      [finalScore, reasoning, JSON.stringify({ pros, cons }), userId]
    );

    res.status(200).json({
      score: finalScore,
      reasoning,
      highlights: { pros, cons }
    });
  } catch (error) {
    console.error("Analysis Error:", error.message);
    res.status(500).json({ error: "Failed to run profile readiness analysis." });
  }
});

export default router;
