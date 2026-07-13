-- =========================================================
-- 004_SEED_PARTNER_INSTITUTIONS.SQL
-- Seeds realistic partner universities and sample active loans
-- =========================================================

-- 1. Insert Partner Institutions (only if table is empty or specific code doesn't exist)
INSERT INTO institutions (institution_id, name, code, password_hash, address, contact_email, bank_account_number, ifsc_code, bank_name, is_active)
VALUES 
(
    'a1111111-1111-4111-a111-111111111111',
    'BITS Pilani',
    'BITS_PILANI',
    '$2b$10$wCd8UgWqCX/qIMblfPILted54f7bI2JLdTbsv6DooxfcktxNIGiVm',
    'Vidya Vihar, Pilani, Rajasthan 333031',
    'finance@bits-pilani.ac.in',
    '451209887123',
    'ICIC0000312',
    'ICICI Bank',
    TRUE
),
(
    'a2222222-2222-4222-a222-222222222222',
    'IIT Delhi',
    'IIT_DELHI',
    '$2b$10$wCd8UgWqCX/qIMblfPILted54f7bI2JLdTbsv6DooxfcktxNIGiVm',
    'Hauz Khas, New Delhi 110016',
    'accounts@iitd.ac.in',
    '107738291045',
    'SBIN0001077',
    'State Bank of India',
    TRUE
),
(
    'a3333333-3333-4333-a333-333333333333',
    'IIM Ahmedabad',
    'IIM_AHMEDABAD',
    '$2b$10$wCd8UgWqCX/qIMblfPILted54f7bI2JLdTbsv6DooxfcktxNIGiVm',
    'Vastrapur, Ahmedabad, Gujarat 380015',
    'bursar@iima.ac.in',
    '50100238192031',
    'HDFC0000006',
    'HDFC Bank',
    TRUE
),
(
    'a4444444-4444-4444-a444-444444444444',
    'VIT Vellore',
    'VIT_VELLORE',
    '$2b$10$wCd8UgWqCX/qIMblfPILted54f7bI2JLdTbsv6DooxfcktxNIGiVm',
    'Katpadi, Vellore, Tamil Nadu 632014',
    'fees@vit.ac.in',
    '6234819203',
    'IDIB000V086',
    'Indian Bank',
    TRUE
)
ON CONFLICT (code) DO NOTHING;

-- 2. Insert Institution Admin Users for each college
INSERT INTO users (user_id, institution_id, full_name, email, mobile_number, password_hash, role, college_roll_number, kyc_status)
VALUES 
(
    'b1111111-1111-4111-b111-111111111111',
    'a1111111-1111-4111-a111-111111111111',
    'BITS Pilani Admin',
    'admin@bits-pilani.ac.in',
    '9811111111',
    '$2b$10$wCd8UgWqCX/qIMblfPILted54f7bI2JLdTbsv6DooxfcktxNIGiVm',
    'INSTITUTION_ADMIN',
    'ADMIN_BITS',
    'VERIFIED'
),
(
    'b2222222-2222-4222-b222-222222222222',
    'a2222222-2222-4222-a222-222222222222',
    'IIT Delhi Admin',
    'admin@iitd.ac.in',
    '9822222222',
    '$2b$10$wCd8UgWqCX/qIMblfPILted54f7bI2JLdTbsv6DooxfcktxNIGiVm',
    'INSTITUTION_ADMIN',
    'ADMIN_IITD',
    'VERIFIED'
),
(
    'b3333333-3333-4333-b333-333333333333',
    'a3333333-3333-4333-a333-333333333333',
    'IIM Ahmedabad Admin',
    'admin@iima.ac.in',
    '9833333333',
    '$2b$10$wCd8UgWqCX/qIMblfPILted54f7bI2JLdTbsv6DooxfcktxNIGiVm',
    'INSTITUTION_ADMIN',
    'ADMIN_IIMA',
    'VERIFIED'
),
(
    'b4444444-4444-4444-b444-444444444444',
    'a4444444-4444-4444-a444-444444444444',
    'VIT Vellore Admin',
    'admin@vit.ac.in',
    '9844444444',
    '$2b$10$wCd8UgWqCX/qIMblfPILted54f7bI2JLdTbsv6DooxfcktxNIGiVm',
    'INSTITUTION_ADMIN',
    'ADMIN_VIT',
    'VERIFIED'
)
ON CONFLICT (email) DO NOTHING;

-- 3. Insert Sample Student Users across colleges
INSERT INTO users (user_id, institution_id, full_name, email, mobile_number, password_hash, role, college_roll_number, kyc_status)
VALUES 
(
    'c1111111-1111-4111-c111-111111111111',
    'a1111111-1111-4111-a111-111111111111',
    'Aarav Sharma',
    'aarav.sharma@bits-pilani.ac.in',
    '9911001100',
    '$2b$10$wCd8UgWqCX/qIMblfPILted54f7bI2JLdTbsv6DooxfcktxNIGiVm',
    'STUDENT',
    '2024A7PS001P',
    'VERIFIED'
),
(
    'c2222222-2222-4222-c222-222222222222',
    'a2222222-2222-4222-a222-222222222222',
    'Diya Verma',
    'diya.verma@iitd.ac.in',
    '9922002200',
    '$2b$10$wCd8UgWqCX/qIMblfPILted54f7bI2JLdTbsv6DooxfcktxNIGiVm',
    'STUDENT',
    '2023CS10112',
    'VERIFIED'
),
(
    'c3333333-3333-4333-c333-333333333333',
    'a3333333-3333-4333-a333-333333333333',
    'Rohan Gupta',
    'rohan.gupta@iima.ac.in',
    '9933003300',
    '$2b$10$wCd8UgWqCX/qIMblfPILted54f7bI2JLdTbsv6DooxfcktxNIGiVm',
    'STUDENT',
    'PGP2025044',
    'VERIFIED'
)
ON CONFLICT (email) DO NOTHING;

-- 4. Insert Sample Loans
INSERT INTO loans (loan_id, user_id, institution_id, student_account_number, student_ifsc_code, requested_amount, approved_amount, interest_rate, tenure_months, course_name, total_fees, status)
VALUES 
(
    'd1111111-1111-4111-d111-111111111111',
    'c1111111-1111-4111-c111-111111111111',
    'a1111111-1111-4111-a111-111111111111',
    '991100110011',
    'ICIC0000312',
    250000.00,
    250000.00,
    10.5,
    24,
    'B.Tech Computer Science - Semester 4',
    250000.00,
    'ACTIVE'
),
(
    'd2222222-2222-4222-d222-222222222222',
    'c2222222-2222-4222-c222-222222222222',
    'a2222222-2222-4222-a222-222222222222',
    '992200220022',
    'SBIN0001077',
    400000.00,
    400000.00,
    11.0,
    36,
    'B.Tech Electrical Engineering',
    400000.00,
    'ACTIVE'
),
(
    'd3333333-3333-4333-d333-333333333333',
    'c3333333-3333-4333-c333-333333333333',
    'a3333333-3333-4333-a333-333333333333',
    '993300330033',
    'HDFC0000006',
    800000.00,
    800000.00,
    9.5,
    48,
    'MBA Executive Program',
    800000.00,
    'UNDER_REVIEW'
)
ON CONFLICT (loan_id) DO NOTHING;
