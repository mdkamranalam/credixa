import express from "express";
import {
  getAnalytics,
  getInstitutions,
  createInstitution,
  toggleInstitutionStatus,
  getUniversalLoans,
  overrideLoanDecision,
  getAuditLogs,
  getPlatformSettings,
  updatePlatformSettings,
  getUsers
} from "../controllers/superadmin.controller.js";

const router = express.Router();

// 1. Ecosystem Analytics
router.get("/analytics", getAnalytics);

// 2. Partner Institutions Governance
router.get("/institutions", getInstitutions);
router.post("/institutions", createInstitution);
router.put("/institutions/:id/status", toggleInstitutionStatus);

// 3. Central Underwriting & Loan Vault
router.get("/loans", getUniversalLoans);
router.put("/loans/:id/override", overrideLoanDecision);

// 4. Platform Audit Trail
router.get("/audit-logs", getAuditLogs);

// 5. AI Risk Engine & Platform Settings
router.get("/settings", getPlatformSettings);
router.put("/settings", updatePlatformSettings);

// 6. Universal User Directory
router.get("/users", getUsers);

export default router;
