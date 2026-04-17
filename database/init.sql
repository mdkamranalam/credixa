-- =========================================================
-- CREDIXA DATABASE SCHEMA (PostgreSQL)
-- =========================================================

-- 1. SETUP EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
-- 2. DEFINE ENUM TYPES
CREATE TYPE kyc_status_enum AS ENUM ('PENDING', 'VERIFIED', 'REJECTED');
CREATE TYPE loan_status_enum AS ENUM (
    'APPLIED',
    'UNDER_REVIEW',
    'APPROVED',
    'ACTIVE',
    'REJECTED',
    'CLOSED',
    'DEFAULTED'
);
CREATE TYPE txn_type_enum AS ENUM ('DISBURSAL', 'REPAYMENT', 'LATE_FEE', 'REFUND');
CREATE TYPE txn_status_enum AS ENUM ('INITIATED', 'SUCCESS', 'FAILED', 'PENDING');

-- 3. UTILITY FUNCTIONS
CREATE OR REPLACE FUNCTION update_modified_column() RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = NOW();
RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =========================================================
-- 4. INDEPENDENT TABLES
-- =========================================================
-- TABLE - 1: INSTITUTIONS
CREATE TABLE institutions (
    institution_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    address TEXT,
    contact_email VARCHAR(155),
    bank_account_number VARCHAR(50) NOT NULL,
    ifsc_code VARCHAR(20) NOT NULL,
    bank_name VARCHAR(100) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- TABLE - 2: USERS
CREATE TABLE users (
    user_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    institution_id UUID REFERENCES institutions(institution_id) ON DELETE SET NULL,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(155) UNIQUE NOT NULL,
    mobile_number VARCHAR(15) UNIQUE NOT NULL CHECK (mobile_number ~ '^[0-9]{10,15}$'),
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL,
    pan_number VARCHAR(10) UNIQUE CHECK (pan_number ~ '^[A-Z]{5}[0-9]{4}[A-Z]{1}$'),
    aadhaar_hash VARCHAR(255),
    kyc_status kyc_status_enum DEFAULT 'PENDING',
    dob DATE,
    current_address TEXT,
    parent_name VARCHAR(100),
    parent_pan VARCHAR(10),
    parent_annual_income DECIMAL(12, 2) DEFAULT 0.00,
    college_roll_number VARCHAR(50) NOT NULL,
    academic_status VARCHAR(20) DEFAULT 'PASS',
    risk_flags TEXT [],
    kyc_source VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =========================================================
-- 5. DEPENDENT TABLES
-- =========================================================
-- TABLE - 3: CONSENT HANDLES (Sahamati)
CREATE TABLE consent_handles (
    consent_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
    aa_handle VARCHAR(100),
    -- e.g., 'user@onemoney'
    consent_status VARCHAR(50) DEFAULT 'PENDING',
    valid_from TIMESTAMP WITH TIME ZONE,
    valid_to TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
-- TABLE - 4: LOAN APPLICATIONS
CREATE TABLE loans (
    loan_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(user_id) ON DELETE RESTRICT,
    institution_id UUID REFERENCES institutions(institution_id) ON DELETE RESTRICT,
    student_account_number VARCHAR(20) NOT NULL,
    student_ifsc_code VARCHAR(11) NOT NULL,
    requested_amount DECIMAL(12, 2) NOT NULL CHECK (requested_amount > 0),
    approved_amount DECIMAL(12, 2) DEFAULT 0.00,
    interest_rate DECIMAL(5, 2) NOT NULL,
    tenure_months INT NOT NULL,
    status loan_status_enum DEFAULT 'APPLIED',
    rejection_reason TEXT,
    is_secured BOOLEAN DEFAULT FALSE,
    course_name VARCHAR(255),
    total_fees DECIMAL(12, 2),
    disbursed_at TIMESTAMP WITH TIME ZONE,
    closed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
-- TABLE - 5: TRANSACTIONS
CREATE TABLE transactions (
    txn_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    loan_id UUID REFERENCES loans(loan_id) ON DELETE RESTRICT,
    user_id UUID REFERENCES users(user_id) ON DELETE RESTRICT,
    amount DECIMAL(12, 2) NOT NULL,
    txn_type txn_type_enum NOT NULL,
    status txn_status_enum DEFAULT 'INITIATED',
    gateway_txn_id VARCHAR(255),
    idempotency_key VARCHAR(255) UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
-- TABLE - 6: REPAYMENT SCHEDULES
CREATE TABLE repayment_schedules (
    schedule_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    loan_id UUID REFERENCES loans(loan_id) ON DELETE CASCADE,
    due_date DATE NOT NULL,
    emi_amount DECIMAL(12, 2) NOT NULL,
    principal_component DECIMAL(12, 2),
    interest_component DECIMAL(12, 2),
    status VARCHAR(20) DEFAULT 'PENDING',
    paid_at TIMESTAMP WITH TIME ZONE
);
-- TABLE - 7: RISK SCORES
CREATE TABLE risk_scores (
    score_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    loan_id UUID REFERENCES loans(loan_id) ON DELETE CASCADE,
    omniscore INT NOT NULL CHECK (
        omniscore BETWEEN 0 AND 900
    ),
    probability_of_default DECIMAL(5, 4),
    risk_tier VARCHAR(20),
    avg_monthly_balance DECIMAL(12, 2),
    income_consistency_score DECIMAL(5, 2),
    risk_flags JSONB,
    decision_latency_ms FLOAT,
    calculated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- TABLE - 8: Co-Applicants
CREATE TABLE co_applicants (
    co_app_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    loan_id UUID REFERENCES loans(loan_id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
    full_name VARCHAR(255) NOT NULL,
    relationship VARCHAR(50) NOT NULL,
    aadhaar_number VARCHAR(12) UNIQUE,
    pan_number VARCHAR(10) UNIQUE,
    income_type VARCHAR(20),
    monthly_income DECIMAL(12, 2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- TABLE - 9: Loan Documents
CREATE TABLE loan_documents (
    doc_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    loan_id UUID REFERENCES loans(loan_id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
    owner_type VARCHAR(20) NOT NULL,
    category VARCHAR(50) NOT NULL,
    doc_type VARCHAR(100) NOT NULL,
    file_url TEXT NOT NULL,
    extraction_method VARCHAR(50),
    extraction_confidence DECIMAL(5, 2),
    is_verified BOOLEAN DEFAULT FALSE,
    verified_at TIMESTAMP WITH TIME ZONE,
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =========================================================
-- 6. INDEXES
-- =========================================================
CREATE INDEX idx_users_mobile ON users(mobile_number);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_loans_user ON loans(user_id);
CREATE INDEX idx_loans_status ON loans(status);
CREATE INDEX idx_txn_loan ON transactions(loan_id);
CREATE INDEX idx_txn_date ON transactions(created_at);

-- =========================================================
-- 7. TRIGGERS
-- =========================================================
CREATE TRIGGER update_users_modtime BEFORE
UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_modified_column();
CREATE TRIGGER update_loans_modtime BEFORE
UPDATE ON loans FOR EACH ROW EXECUTE FUNCTION update_modified_column();
CREATE TRIGGER update_institutions_modtime BEFORE
UPDATE ON institutions FOR EACH ROW EXECUTE FUNCTION update_modified_column();
