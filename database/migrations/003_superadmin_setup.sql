-- =========================================================
-- CREDIXA MIGRATION 003: SUPERADMIN COMMAND CENTER & SETTINGS
-- =========================================================

-- 1. PLATFORM SETTINGS TABLE
-- Stores global configuration for AI underwriting, default interest rates, and system policies
CREATE TABLE IF NOT EXISTS platform_settings (
    setting_key   VARCHAR(100) PRIMARY KEY,
    setting_value JSONB NOT NULL,
    description   TEXT,
    updated_by    UUID REFERENCES users(user_id) ON DELETE SET NULL,
    updated_at    TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. SEED INITIAL PLATFORM SETTINGS
INSERT INTO platform_settings (setting_key, setting_value, description)
VALUES (
    'risk_engine_thresholds',
    '{
      "low_risk_min": 700,
      "medium_risk_min": 500,
      "default_interest_rate": 12.5,
      "late_fee_flat": 500.00,
      "max_dti_ratio": 0.60,
      "auto_lock_fraud": true
    }'::jsonb,
    'Global configuration thresholds for AI underwriting and repayment calculations'
) ON CONFLICT (setting_key) DO UPDATE
SET setting_value = EXCLUDED.setting_value,
    updated_at = NOW();

-- 3. SEED ROOT SUPERADMIN USER
-- Default Email: superadmin@credixa.com
-- Default Password: SuperAdmin@2026!
-- Note: institution_id is explicitly NULL as Superadmin governs the entire platform
INSERT INTO users (
    full_name,
    email,
    password_hash,
    role,
    institution_id,
    college_roll_number,
    kyc_status
) VALUES (
    'Credixa Central HQ',
    'superadmin@credixa.com',
    '$2b$10$wCd8UgWqCX/qIMblfPILted54f7bI2JLdTbsv6DooxfcktxNIGiVm',
    'SUPER_ADMIN',
    NULL,
    'SUPER_ADMIN_ROOT',
    'VERIFIED'
) ON CONFLICT (email) DO UPDATE
SET role = 'SUPER_ADMIN',
    institution_id = NULL,
    kyc_status = 'VERIFIED';
