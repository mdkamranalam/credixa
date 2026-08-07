-- =========================================================
-- 004_SEED_PARTNER_INSTITUTIONS.SQL
-- Seeds realistic partner universities and sample active loans
-- =========================================================

-- 1. Insert Partner Institutions (only if table is empty or specific code doesn't exist)
INSERT INTO institutions (institution_id, name, code, password_hash, address, contact_email, bank_account_number, ifsc_code, bank_name, is_active)
VALUES 
(
    'a1111111-1111-4111-a111-111111111111',
    'Apex Institute of Technology',
    'APEX-001',
    '$2b$10$fU.K9ti8nOqdcnDqYgkttuj0XsgzbKl8rHRHUMdQ6Bv6iGD.FfGoe',
    'Knowledge Park III, Greater Noida, UP',
    'admin@apex.edu.in',
    '50100234567890',
    'HDFC0001234',
    'HDFC Bank',
    TRUE
),
(
    'a2222222-2222-4222-a222-222222222222',
    'Manipal Institute of Technology (MIT)',
    'MIT-002',
    '$2b$10$Im4jJALdcfD8WjQxVYluzOXUp5CR4YCPzXFVx4mGqESRQpPI71et.',
    'Madhav Nagar, Manipal, Karnataka',
    'admin@manipal.edu',
    '007205001234',
    'ICIC0000072',
    'ICICI Bank',
    TRUE
),
(
    'a3333333-3333-4333-a333-333333333333',
    'Vellore Institute of Technology (VIT)',
    'VIT-003',
    '$2b$10$scgK0mohx.fiqI3.PjcveOvqbYF3pj.OGQSH.7nbt1fcQD9feuZ8K',
    'Katpadi Road, Vellore, Tamil Nadu',
    'admin@vit.ac.in',
    '601234567890',
    'IDIB000V086',
    'Indian Bank',
    TRUE
),
(
    'a4444444-4444-4444-a444-444444444444',
    'College of Engineering Pune (COEP)',
    'COEP-004',
    '$2b$10$qZMbV4I1pqcI7hBAh.rVLuF/VeunhM8bCr7SUFwGRArRf85m2qrBW',
    'Wellesley Road, Shivajinagar, Pune, Maharashtra',
    'admin@coep.ac.in',
    '30123456789',
    'SBIN0001110',
    'State Bank of India',
    TRUE
),
(
    'a5555555-5555-4555-a555-555555555555',
    'SRM Institute of Science and Technology',
    'SRM-005',
    '$2b$10$t64GS64rMsWg0XqMLZ0VZOJZITVSoHEACGzozK9fHEHJ8L66PkYiq',
    'Kattankulathur, Chengalpattu, Tamil Nadu',
    'admin@srmist.edu.in',
    '500101012345678',
    'CIUB0000117',
    'City Union Bank',
    TRUE
),
(
    'a6666666-6666-4666-a666-666666666666',
    'National Institute of Technology (NIT), Tiruchirappalli',
    'NITT-006',
    '$2b$10$XKHL6zND4B4Kj/mWy/SCJuvb.er.vHf3MkwZCpFgqi97WsuvJou2q',
    'Tanjore Main Road, National Highway 67, Tiruchirappalli',
    'admin@nitt.edu',
    '10892345678',
    'SBIN0001617',
    'State Bank of India',
    TRUE
),
(
    'a7777777-7777-4777-a777-777777777777',
    'Birla Institute of Technology and Science (BITS), Pilani',
    'BITS-007',
    '$2b$10$knZOTa6vRC5/Ag1FQ84cU.JJ3IsWnCtFUY3TX9IybHtTaQ6uIKSJe',
    'Vidya Vihar, Pilani, Rajasthan',
    'admin@pilani.bits-pilani.ac.in',
    '031805001234',
    'ICIC0000318',
    'ICICI Bank',
    TRUE
)
ON CONFLICT (institution_id) DO UPDATE SET 
    name = EXCLUDED.name,
    code = EXCLUDED.code,
    password_hash = EXCLUDED.password_hash,
    address = EXCLUDED.address,
    contact_email = EXCLUDED.contact_email,
    bank_account_number = EXCLUDED.bank_account_number,
    ifsc_code = EXCLUDED.ifsc_code,
    bank_name = EXCLUDED.bank_name,
    is_active = EXCLUDED.is_active;

-- 2. Insert Institution Admin Users for each college
INSERT INTO users (user_id, institution_id, full_name, email, mobile_number, password_hash, role, college_roll_number, kyc_status)
VALUES 
(
    'b1111111-1111-4111-b111-111111111111',
    'a1111111-1111-4111-a111-111111111111',
    'Apex Institute of Technology Admin',
    'admin@apex.edu.in',
    '9811111111',
    '$2b$10$fU.K9ti8nOqdcnDqYgkttuj0XsgzbKl8rHRHUMdQ6Bv6iGD.FfGoe',
    'INSTITUTION_ADMIN',
    'ADMIN_APEX',
    'VERIFIED'
),
(
    'b2222222-2222-4222-b222-222222222222',
    'a2222222-2222-4222-a222-222222222222',
    'Manipal Institute of Technology (MIT) Admin',
    'admin@manipal.edu',
    '9822222222',
    '$2b$10$Im4jJALdcfD8WjQxVYluzOXUp5CR4YCPzXFVx4mGqESRQpPI71et.',
    'INSTITUTION_ADMIN',
    'ADMIN_MIT',
    'VERIFIED'
),
(
    'b3333333-3333-4333-b333-333333333333',
    'a3333333-3333-4333-a333-333333333333',
    'Vellore Institute of Technology (VIT) Admin',
    'admin@vit.ac.in',
    '9833333333',
    '$2b$10$scgK0mohx.fiqI3.PjcveOvqbYF3pj.OGQSH.7nbt1fcQD9feuZ8K',
    'INSTITUTION_ADMIN',
    'ADMIN_VIT',
    'VERIFIED'
),
(
    'b4444444-4444-4444-b444-444444444444',
    'a4444444-4444-4444-a444-444444444444',
    'College of Engineering Pune (COEP) Admin',
    'admin@coep.ac.in',
    '9844444444',
    '$2b$10$qZMbV4I1pqcI7hBAh.rVLuF/VeunhM8bCr7SUFwGRArRf85m2qrBW',
    'INSTITUTION_ADMIN',
    'ADMIN_COEP',
    'VERIFIED'
),
(
    'b5555555-5555-4555-b555-555555555555',
    'a5555555-5555-4555-a555-555555555555',
    'SRM Institute of Science and Technology Admin',
    'admin@srmist.edu.in',
    '9855555555',
    '$2b$10$t64GS64rMsWg0XqMLZ0VZOJZITVSoHEACGzozK9fHEHJ8L66PkYiq',
    'INSTITUTION_ADMIN',
    'ADMIN_SRM',
    'VERIFIED'
),
(
    'b6666666-6666-4666-b666-666666666666',
    'a6666666-6666-4666-a666-666666666666',
    'National Institute of Technology (NIT), Tiruchirappalli Admin',
    'admin@nitt.edu',
    '9866666666',
    '$2b$10$XKHL6zND4B4Kj/mWy/SCJuvb.er.vHf3MkwZCpFgqi97WsuvJou2q',
    'INSTITUTION_ADMIN',
    'ADMIN_NITT',
    'VERIFIED'
),
(
    'b7777777-7777-4777-b777-777777777777',
    'a7777777-7777-4777-a777-777777777777',
    'Birla Institute of Technology and Science (BITS), Pilani Admin',
    'admin@pilani.bits-pilani.ac.in',
    '9877777777',
    '$2b$10$knZOTa6vRC5/Ag1FQ84cU.JJ3IsWnCtFUY3TX9IybHtTaQ6uIKSJe',
    'INSTITUTION_ADMIN',
    'ADMIN_BITS_PILANI',
    'VERIFIED'
)
ON CONFLICT (user_id) DO UPDATE SET 
    institution_id = EXCLUDED.institution_id,
    full_name = EXCLUDED.full_name,
    email = EXCLUDED.email,
    mobile_number = EXCLUDED.mobile_number,
    password_hash = EXCLUDED.password_hash,
    role = EXCLUDED.role,
    college_roll_number = EXCLUDED.college_roll_number,
    kyc_status = EXCLUDED.kyc_status;

-- 3. Insert Sample Student Users across colleges
INSERT INTO users (user_id, institution_id, full_name, email, mobile_number, password_hash, role, college_roll_number, kyc_status)
VALUES 
(
    'c1111111-1111-4111-c111-111111111111',
    'a1111111-1111-4111-a111-111111111111',
    'Aarav Sharma',
    'aarav.sharma@apex.edu.in',
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
    'diya.verma@manipal.edu',
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
    'rohan.gupta@vit.ac.in',
    '9933003300',
    '$2b$10$wCd8UgWqCX/qIMblfPILted54f7bI2JLdTbsv6DooxfcktxNIGiVm',
    'STUDENT',
    'PGP2025044',
    'VERIFIED'
)
ON CONFLICT (user_id) DO UPDATE SET 
    institution_id = EXCLUDED.institution_id,
    full_name = EXCLUDED.full_name,
    email = EXCLUDED.email,
    mobile_number = EXCLUDED.mobile_number,
    password_hash = EXCLUDED.password_hash,
    role = EXCLUDED.role,
    college_roll_number = EXCLUDED.college_roll_number,
    kyc_status = EXCLUDED.kyc_status;

-- 4. Insert Sample Loans
INSERT INTO loans (loan_id, user_id, institution_id, student_account_number, student_ifsc_code, requested_amount, approved_amount, interest_rate, tenure_months, course_name, total_fees, status)
VALUES 
(
    'd1111111-1111-4111-d111-111111111111',
    'c1111111-1111-4111-c111-111111111111',
    'a1111111-1111-4111-a111-111111111111',
    '991100110011',
    'HDFC0001234',
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
    'ICIC0000072',
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
    'IDIB000V086',
    800000.00,
    800000.00,
    9.5,
    48,
    'MBA Executive Program',
    800000.00,
    'UNDER_REVIEW'
)
ON CONFLICT (loan_id) DO UPDATE SET 
    user_id = EXCLUDED.user_id,
    institution_id = EXCLUDED.institution_id,
    student_account_number = EXCLUDED.student_account_number,
    student_ifsc_code = EXCLUDED.student_ifsc_code,
    requested_amount = EXCLUDED.requested_amount,
    approved_amount = EXCLUDED.approved_amount,
    interest_rate = EXCLUDED.interest_rate,
    tenure_months = EXCLUDED.tenure_months,
    course_name = EXCLUDED.course_name,
    total_fees = EXCLUDED.total_fees,
    status = EXCLUDED.status;
