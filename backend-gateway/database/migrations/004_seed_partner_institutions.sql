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
),
(
    'a5555555-5555-4555-a555-555555555555',
    'IIT Bombay',
    'IIT_BOMBAY',
    '$2b$10$wCd8UgWqCX/qIMblfPILted54f7bI2JLdTbsv6DooxfcktxNIGiVm',
    'Powai, Mumbai, Maharashtra 400076',
    'accounts@iitb.ac.in',
    '50000000001',
    'SBIN0001111',
    'State Bank of India',
    TRUE
),
(
    'a6666666-6666-4666-a666-666666666666',
    'IIT Madras',
    'IIT_MADRAS',
    '$2b$10$wCd8UgWqCX/qIMblfPILted54f7bI2JLdTbsv6DooxfcktxNIGiVm',
    'Chennai, Tamil Nadu 600036',
    'accounts@iitm.ac.in',
    '60000000002',
    'SBIN0002222',
    'State Bank of India',
    TRUE
),
(
    'a7777777-7777-4777-a777-777777777777',
    'IIM Bangalore',
    'IIM_BANGALORE',
    '$2b$10$wCd8UgWqCX/qIMblfPILted54f7bI2JLdTbsv6DooxfcktxNIGiVm',
    'Bannerghatta Road, Bengaluru, Karnataka 560076',
    'accounts@iimb.ac.in',
    '70000000003',
    'HDFC0003333',
    'HDFC Bank',
    TRUE
),
(
    'a8888888-8888-4888-a888-888888888888',
    'IIT Patna',
    'IIT_PATNA',
    '$2b$10$wCd8UgWqCX/qIMblfPILted54f7bI2JLdTbsv6DooxfcktxNIGiVm',
    'Bihta, Patna, Bihar 801106',
    'accounts@iitp.ac.in',
    '80000000004',
    'SBIN0004444',
    'State Bank of India',
    TRUE
),
(
    'a9999999-9999-4999-a999-999999999999',
    'NIT Patna',
    'NIT_PATNA',
    '$2b$10$wCd8UgWqCX/qIMblfPILted54f7bI2JLdTbsv6DooxfcktxNIGiVm',
    'Ashok Rajpath, Patna, Bihar 800005',
    'accounts@nitp.ac.in',
    '90000000005',
    'SBIN0005555',
    'State Bank of India',
    TRUE
),
(
    'a0000000-0000-4000-a000-000000000000',
    'IIT Hyderabad',
    'IIT_HYDERABAD',
    '$2b$10$wCd8UgWqCX/qIMblfPILted54f7bI2JLdTbsv6DooxfcktxNIGiVm',
    'Kandi, Sangareddy, Telangana 502285',
    'accounts@iith.ac.in',
    '10000000006',
    'SBIN0006666',
    'State Bank of India',
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
),
(
    'b5555555-5555-4555-b555-555555555555',
    'a5555555-5555-4555-a555-555555555555',
    'IIT Bombay Admin',
    'admin@iitb.ac.in',
    '9855555555',
    '$2b$10$wCd8UgWqCX/qIMblfPILted54f7bI2JLdTbsv6DooxfcktxNIGiVm',
    'INSTITUTION_ADMIN',
    'ADMIN_IITB',
    'VERIFIED'
),
(
    'b6666666-6666-4666-b666-666666666666',
    'a6666666-6666-4666-a666-666666666666',
    'IIT Madras Admin',
    'admin@iitm.ac.in',
    '9866666666',
    '$2b$10$wCd8UgWqCX/qIMblfPILted54f7bI2JLdTbsv6DooxfcktxNIGiVm',
    'INSTITUTION_ADMIN',
    'ADMIN_IITM',
    'VERIFIED'
),
(
    'b7777777-7777-4777-b777-777777777777',
    'a7777777-7777-4777-a777-777777777777',
    'IIM Bangalore Admin',
    'admin@iimb.ac.in',
    '9877777777',
    '$2b$10$wCd8UgWqCX/qIMblfPILted54f7bI2JLdTbsv6DooxfcktxNIGiVm',
    'INSTITUTION_ADMIN',
    'ADMIN_IIMB',
    'VERIFIED'
),
(
    'b8888888-8888-4888-b888-888888888888',
    'a8888888-8888-4888-a888-888888888888',
    'IIT Patna Admin',
    'admin@iitp.ac.in',
    '9888888888',
    '$2b$10$wCd8UgWqCX/qIMblfPILted54f7bI2JLdTbsv6DooxfcktxNIGiVm',
    'INSTITUTION_ADMIN',
    'ADMIN_IITP',
    'VERIFIED'
),
(
    'b9999999-9999-4999-b999-999999999999',
    'a9999999-9999-4999-a999-999999999999',
    'NIT Patna Admin',
    'admin@nitp.ac.in',
    '9899999999',
    '$2b$10$wCd8UgWqCX/qIMblfPILted54f7bI2JLdTbsv6DooxfcktxNIGiVm',
    'INSTITUTION_ADMIN',
    'ADMIN_NITP',
    'VERIFIED'
),
(
    'b0000000-0000-4000-b000-000000000000',
    'a0000000-0000-4000-a000-000000000000',
    'IIT Hyderabad Admin',
    'admin@iith.ac.in',
    '9800000000',
    '$2b$10$wCd8UgWqCX/qIMblfPILted54f7bI2JLdTbsv6DooxfcktxNIGiVm',
    'INSTITUTION_ADMIN',
    'ADMIN_IITH',
    'VERIFIED'
)
ON CONFLICT (email) DO NOTHING;


