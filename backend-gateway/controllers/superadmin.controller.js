import pool from "../utils/db.js";
import logger from "../utils/logger.js";
import bcrypt from "bcrypt";
import { logLoanAction, createNotification } from "../utils/audit.js";
import { broadcastGlobalEvent } from "../utils/sseManager.js";

/**
 * 1. GET /api/superadmin/analytics
 * Returns comprehensive system-wide KPIs and institution leaderboard.
 */
export const getAnalytics = async (req, res) => {
  try {
    const kpiQuery = `
      SELECT 
        (SELECT COUNT(*) FROM loans) AS total_loans,
        (SELECT COALESCE(SUM(COALESCE(NULLIF(approved_amount, 0), requested_amount, 0)), 0) FROM loans WHERE status IN ('ACTIVE', 'DEFAULTED', 'CLOSED')) AS total_disbursed,
        (SELECT COALESCE(SUM(COALESCE(NULLIF(approved_amount, 0), requested_amount, 0)), 0) FROM loans WHERE status = 'DEFAULTED') AS defaulted_volume,
        (SELECT COUNT(*) FROM users WHERE role = 'STUDENT') AS total_students,
        (SELECT COUNT(*) FROM institutions) AS total_institutions;
    `;
    const kpiRes = await pool.query(kpiQuery);
    const kpis = kpiRes.rows[0];

    // Calculate overall repayment recovery rate from repayment_schedules
    const recoveryQuery = `
      SELECT 
        COALESCE(SUM(emi_amount) FILTER (WHERE status = 'PAID'), 0) AS collected_emi,
        COALESCE(SUM(emi_amount), 0) AS total_emi
      FROM repayment_schedules;
    `;
    const recRes = await pool.query(recoveryQuery);
    const rec = recRes.rows[0];
    const recoveryRate = parseFloat(rec.total_emi) > 0 
      ? Math.round((parseFloat(rec.collected_emi) / parseFloat(rec.total_emi)) * 100) 
      : 100;

    const npaRatio = parseFloat(kpis.total_disbursed) > 0
      ? ((parseFloat(kpis.defaulted_volume) / parseFloat(kpis.total_disbursed)) * 100).toFixed(2)
      : 0;

    // Leaderboard comparing institution portfolios
    const leaderboardQuery = `
      SELECT 
        i.institution_id,
        i.name,
        i.code,
        i.is_active,
        (SELECT COUNT(*) FROM users u WHERE u.institution_id = i.institution_id AND u.role = 'STUDENT') AS student_count,
        (SELECT COUNT(*) FROM loans l WHERE l.institution_id = i.institution_id) AS loan_count,
        (SELECT COALESCE(SUM(COALESCE(NULLIF(approved_amount, 0), requested_amount, 0)), 0) FROM loans l WHERE l.institution_id = i.institution_id AND l.status IN ('ACTIVE', 'CLOSED', 'DEFAULTED')) AS active_volume,
        (SELECT COALESCE(SUM(COALESCE(NULLIF(approved_amount, 0), requested_amount, 0)), 0) FROM loans l WHERE l.institution_id = i.institution_id AND l.status = 'DEFAULTED') AS defaulted_volume
      FROM institutions i
      ORDER BY active_volume DESC;
    `;
    const lbRes = await pool.query(leaderboardQuery);

    return res.status(200).json({
      kpis: {
        totalLoans: parseInt(kpis.total_loans || 0, 10),
        totalDisbursed: parseFloat(kpis.total_disbursed || 0),
        defaultedVolume: parseFloat(kpis.defaulted_volume || 0),
        totalStudents: parseInt(kpis.total_students || 0, 10),
        totalInstitutions: parseInt(kpis.total_institutions || 0, 10),
        recoveryRate,
        npaRatio: parseFloat(npaRatio)
      },
      leaderboard: lbRes.rows
    });
  } catch (error) {
    logger.error("Error in superadmin getAnalytics:", error);
    return res.status(500).json({ error: "Failed to fetch global analytics." });
  }
};

/**
 * 2. GET /api/superadmin/institutions
 * Lists all partner colleges along with active volume and admin contacts.
 */
export const getInstitutions = async (req, res) => {
  try {
    const query = `
      SELECT 
        i.*,
        (SELECT COUNT(*) FROM users u WHERE u.institution_id = i.institution_id AND u.role = 'STUDENT') AS student_count,
        (SELECT COUNT(*) FROM users a WHERE a.institution_id = i.institution_id AND a.role = 'INSTITUTION_ADMIN') AS admin_count,
        (SELECT COALESCE(SUM(COALESCE(NULLIF(approved_amount, 0), requested_amount, 0)), 0) FROM loans l WHERE l.institution_id = i.institution_id AND l.status IN ('ACTIVE', 'DEFAULTED', 'CLOSED')) AS total_disbursed
      FROM institutions i
      ORDER BY i.name ASC;
    `;
    const result = await pool.query(query);
    return res.status(200).json({ institutions: result.rows });
  } catch (error) {
    logger.error("Error in superadmin getInstitutions:", error);
    return res.status(500).json({ error: "Failed to fetch institutions list." });
  }
};

/**
 * 2.5. POST /api/superadmin/institutions
 * Creates/onboards a new partner college + admin account.
 */
export const createInstitution = async (req, res) => {
  const { 
    name, code, contact_email, password, address, 
    bank_account_number, ifsc_code, bank_name 
  } = req.body;

  if (!name || !code || !contact_email || !password) {
    return res.status(400).json({ error: "Name, code, contact_email, and password are required." });
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const passwordHash = await bcrypt.hash(password, 10);

    const instQuery = `
      INSERT INTO institutions (
        name, code, contact_email, password_hash, address, 
        bank_account_number, ifsc_code, bank_name, is_active
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, TRUE)
      RETURNING *;
    `;
    const instValues = [
      name, code.toUpperCase(), contact_email, passwordHash, address || "Main Campus Address",
      bank_account_number || "000000000000", ifsc_code || "SBIN0000001", bank_name || "State Bank of India"
    ];
    const instResult = await client.query(instQuery, instValues);
    const newInst = instResult.rows[0];

    const userQuery = `
      INSERT INTO users (
        full_name, email, mobile_number, password_hash, 
        role, institution_id, college_roll_number, kyc_status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'VERIFIED')
      RETURNING user_id, full_name, email, role;
    `;
    const userValues = [
      `${name} Admin`,
      contact_email,
      null,
      passwordHash,
      "INSTITUTION_ADMIN",
      newInst.institution_id,
      `ADMIN_${code.toUpperCase()}`
    ];
    await client.query(userQuery, userValues);

    await client.query("COMMIT");

    logger.info(`Superadmin created new institution: ${name} (${code})`);
    broadcastGlobalEvent("INSTITUTION_CREATED", { institution: newInst });

    return res.status(201).json({ message: "Institution onboarded successfully!", institution: newInst });
  } catch (error) {
    await client.query("ROLLBACK");
    logger.error("Error inside createInstitution:", error);
    if (error.code === "23505") {
      return res.status(400).json({ error: "An institution with this code or contact email already exists." });
    }
    return res.status(500).json({ error: "Failed to create institution." });
  } finally {
    client.release();
  }
};

/**
 * 3. PUT /api/superadmin/institutions/:id/status
 * Toggles is_active (TRUE/FALSE) for an institution.
 */
export const toggleInstitutionStatus = async (req, res) => {
  const { id } = req.params;
  const { is_active } = req.body;

  try {
    const result = await pool.query(
      `UPDATE institutions SET is_active = $1, updated_at = NOW() WHERE institution_id = $2 RETURNING *`,
      [is_active, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Institution not found." });
    }

    const updatedInst = result.rows[0];
    logger.info(`Superadmin toggled institution ${updatedInst.code} status to ${is_active}`);
    broadcastGlobalEvent("INSTITUTION_STATUS_UPDATE", { institutionId: id, isActive: is_active });

    return res.status(200).json({ message: "Institution status updated.", institution: updatedInst });
  } catch (error) {
    logger.error("Error in toggleInstitutionStatus:", error);
    return res.status(500).json({ error: "Failed to update institution status." });
  }
};

/**
 * 4. GET /api/superadmin/loans
 * Universal loan search and filtering across all institutions.
 */
export const getUniversalLoans = async (req, res) => {
  const { status, institution_id, search, fraud_only } = req.query;

  try {
    let whereClauses = ["1=1"];
    let values = [];
    let idx = 1;

    if (status && status !== "ALL") {
      whereClauses.push(`l.status = $${idx++}`);
      values.push(status);
    }

    if (institution_id && institution_id !== "ALL") {
      whereClauses.push(`l.institution_id = $${idx++}`);
      values.push(institution_id);
    }

    if (fraud_only === "true") {
      whereClauses.push(`(u.pre_approval_score <= 15 OR l.ai_highlights::text ILIKE '%CRITICAL FRAUD FLAG%' OR l.ai_reasoning ILIKE '%REJECTED and locked%')`);
    }

    if (search && search.trim() !== "") {
      whereClauses.push(`(u.full_name ILIKE $${idx} OR u.email ILIKE $${idx} OR u.college_roll_number ILIKE $${idx} OR i.code ILIKE $${idx})`);
      values.push(`%${search.trim()}%`);
      idx++;
    }

    const query = `
      SELECT 
        l.*,
        u.full_name AS student_name,
        u.email AS student_email,
        u.college_roll_number,
        u.pre_approval_score,
        i.name AS institution_name,
        i.code AS institution_code
      FROM loans l
      JOIN users u ON l.user_id = u.user_id
      JOIN institutions i ON l.institution_id = i.institution_id
      WHERE ${whereClauses.join(" AND ")}
      ORDER BY l.created_at DESC
      LIMIT 100;
    `;

    const result = await pool.query(query, values);
    return res.status(200).json({ loans: result.rows });
  } catch (error) {
    logger.error("Error in getUniversalLoans:", error);
    return res.status(500).json({ error: "Failed to query universal loans." });
  }
};

/**
 * 5. PUT /api/superadmin/loans/:id/override
 * Central underwriter override allowing Superadmin to modify status, approved_amount, or unlock fraud.
 */
export const overrideLoanDecision = async (req, res) => {
  const { id } = req.params;
  const { status, approved_amount, admin_notes } = req.body;
  const actorUserId = req.user.user_id || req.user.id;

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const checkLoan = await client.query(`SELECT status, user_id, interest_rate, tenure_months FROM loans WHERE loan_id = $1`, [id]);
    if (checkLoan.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Loan not found." });
    }

    const oldStatus = checkLoan.rows[0].status;
    const loanUserId = checkLoan.rows[0].user_id;
    const interestRate = checkLoan.rows[0].interest_rate || 12.5;
    const tenureMonths = checkLoan.rows[0].tenure_months || 12;

    const updateQuery = `
      UPDATE loans
      SET status = $1,
          approved_amount = COALESCE($2, approved_amount),
          admin_notes = COALESCE($3, admin_notes),
          updated_at = NOW(),
          disbursed_at = CASE WHEN $1 = 'ACTIVE' AND disbursed_at IS NULL THEN NOW() ELSE disbursed_at END
      WHERE loan_id = $4 RETURNING *;
    `;
    const updateRes = await client.query(updateQuery, [status, approved_amount || null, admin_notes || "", id]);
    const updatedLoan = updateRes.rows[0];

    // If transitioned to ACTIVE and schedules don't exist yet, generate repayment schedules
    if (status === "ACTIVE" && oldStatus !== "ACTIVE") {
      const schedCheck = await client.query(`SELECT COUNT(*) FROM repayment_schedules WHERE loan_id = $1`, [id]);
      if (parseInt(schedCheck.rows[0].count, 10) === 0) {
        const amt = parseFloat(updatedLoan.approved_amount || 0);
        const monthlyRate = (interestRate / 100) / 12;
        let emi = monthlyRate === 0 ? amt / tenureMonths : (amt * monthlyRate * Math.pow(1 + monthlyRate, tenureMonths)) / (Math.pow(1 + monthlyRate, tenureMonths) - 1);

        for (let i = 1; i <= tenureMonths; i++) {
          const dueDate = new Date();
          dueDate.setMonth(dueDate.getMonth() + i);
          await client.query(
            "INSERT INTO repayment_schedules (loan_id, due_date, emi_amount, status) VALUES ($1, $2, $3, 'PENDING')",
            [id, dueDate, emi]
          );
        }

        // Record disbursal transaction
        await client.query(
          `INSERT INTO transactions (loan_id, user_id, amount, txn_type, status, idempotency_key)
           VALUES ($1, $2, $3, 'DISBURSAL', 'SUCCESS', $4) ON CONFLICT DO NOTHING`,
          [id, loanUserId, amt, `DISB-SUPER-${id}`]
        );
      }
    }

    await logLoanAction(client, id, actorUserId, "SUPERADMIN_OVERRIDE", oldStatus, status, admin_notes || "Central override by Superadmin");
    await createNotification(
      client,
      loanUserId,
      "Loan Status Updated by Central Underwriter",
      `Your loan status has been updated to ${status}. ${admin_notes ? "Note: " + admin_notes : ""}`
    );

    await client.query("COMMIT");
    logger.info(`Superadmin ${actorUserId} overrode loan ${id} from ${oldStatus} to ${status}`);

    return res.status(200).json({ message: "Loan decision overrode successfully.", loan: updatedLoan });
  } catch (error) {
    await client.query("ROLLBACK");
    logger.error("Error in overrideLoanDecision:", error);
    return res.status(500).json({ error: "Failed to override loan decision." });
  } finally {
    client.release();
  }
};

/**
 * 6. GET /api/superadmin/audit-logs
 * Paginated global system audit logs.
 */
export const getAuditLogs = async (req, res) => {
  const page = parseInt(req.query.page || "1", 10);
  const limit = parseInt(req.query.limit || "50", 10);
  const offset = (page - 1) * limit;

  try {
    const countRes = await pool.query(`SELECT COUNT(*) FROM audit_logs`);
    const total = parseInt(countRes.rows[0].count, 10);

    const query = `
      SELECT 
        a.*,
        a.timestamp AS created_at,
        u.full_name AS actor_name,
        u.email AS actor_email,
        u.role AS actor_role
      FROM audit_logs a
      LEFT JOIN users u ON a.actor_user_id = u.user_id
      ORDER BY a.timestamp DESC
      LIMIT $1 OFFSET $2;
    `;
    const result = await pool.query(query, [limit, offset]);

    return res.status(200).json({
      logs: result.rows,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    logger.error("Error in getAuditLogs:", error);
    return res.status(500).json({ error: "Failed to query audit logs." });
  }
};

/**
 * 7. GET /api/superadmin/settings
 * Queries platform_settings table.
 */
export const getPlatformSettings = async (req, res) => {
  try {
    const result = await pool.query(`SELECT * FROM platform_settings`);
    const settingsMap = {};
    result.rows.forEach(row => {
      settingsMap[row.setting_key] = row.setting_value;
    });
    return res.status(200).json({ settings: settingsMap });
  } catch (error) {
    logger.error("Error in getPlatformSettings:", error);
    return res.status(500).json({ error: "Failed to load platform settings." });
  }
};

/**
 * 8. PUT /api/superadmin/settings
 * Updates a specific platform setting key.
 */
export const updatePlatformSettings = async (req, res) => {
  const { setting_key, setting_value, description } = req.body;
  const actorUserId = req.user.user_id || req.user.id;

  if (!setting_key || !setting_value) {
    return res.status(400).json({ error: "setting_key and setting_value are required." });
  }

  try {
    const query = `
      INSERT INTO platform_settings (setting_key, setting_value, description, updated_by, updated_at)
      VALUES ($1, $2, $3, $4, NOW())
      ON CONFLICT (setting_key) DO UPDATE
      SET setting_value = EXCLUDED.setting_value,
          description = COALESCE(EXCLUDED.description, platform_settings.description),
          updated_by = EXCLUDED.updated_by,
          updated_at = NOW()
      RETURNING *;
    `;
    const result = await pool.query(query, [setting_key, JSON.stringify(setting_value), description || null, actorUserId]);
    logger.info(`Superadmin updated setting ${setting_key}`);

    return res.status(200).json({ message: "Platform settings saved successfully.", setting: result.rows[0] });
  } catch (error) {
    logger.error("Error in updatePlatformSettings:", error);
    return res.status(500).json({ error: "Failed to update platform settings." });
  }
};

/**
 * 9. GET /api/superadmin/users
 * Universal user directory across all roles.
 */
export const getUsers = async (req, res) => {
  const { role, search } = req.query;

  try {
    let whereClauses = ["1=1"];
    let values = [];
    let idx = 1;

    if (role && role !== "ALL") {
      whereClauses.push(`u.role = $${idx++}`);
      values.push(role);
    }

    if (search && search.trim() !== "") {
      whereClauses.push(`(u.full_name ILIKE $${idx} OR u.email ILIKE $${idx} OR u.college_roll_number ILIKE $${idx})`);
      values.push(`%${search.trim()}%`);
      idx++;
    }

    const query = `
      SELECT 
        u.user_id,
        u.full_name,
        u.email,
        u.role,
        u.college_roll_number,
        u.kyc_status,
        u.pre_approval_score,
        u.created_at,
        i.name AS institution_name,
        i.code AS institution_code
      FROM users u
      LEFT JOIN institutions i ON u.institution_id = i.institution_id
      WHERE ${whereClauses.join(" AND ")}
      ORDER BY u.created_at DESC
      LIMIT 150;
    `;
    const result = await pool.query(query, values);
    return res.status(200).json({ users: result.rows });
  } catch (error) {
    logger.error("Error in getUsers:", error);
    return res.status(500).json({ error: "Failed to fetch users directory." });
  }
};
