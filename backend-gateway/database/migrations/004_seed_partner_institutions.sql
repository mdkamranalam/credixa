-- =========================================================
-- 004_SEED_PARTNER_INSTITUTIONS.SQL
-- Seeds realistic partner universities and sample active loans
-- =========================================================

-- 1. Insert Partner Institutions
INSERT INTO institutions (institution_id, name, code, password_hash, address, contact_email, bank_account_number, ifsc_code, bank_name, is_active)
VALUES 
(
    '176b640c-3a40-4ef7-abb9-caca00000001',
    'Apex Institute of Technology',
    'APEX-001',
    '$2b$10$/NT4zOmSvh5Gapfo8AyfJue3EBPcV46vp.dPU7UeYmDIbjAh7sIHu',
    'New Delhi',
    'admin@apex.edu.in',
    '100000001',
    'SBIN0001001',
    'Bank 1',
    TRUE
),
(
    '176b640c-3a40-4ef7-abb9-caca00000002',
    'Manipal Institute of Technology (MIT)',
    'MIT-002',
    '$2b$10$NdPYp3nXKCuaXv6l2bEhrOn3lla.SK7VpA9C06yc8YfVnVoOFFmDO',
    'Manipal',
    'admin@manipal.edu',
    '100000002',
    'SBIN0001002',
    'Bank 2',
    TRUE
),
(
    '176b640c-3a40-4ef7-abb9-caca00000003',
    'Vellore Institute of Technology (VIT)',
    'VIT-003',
    '$2b$10$SATl1awFJ5SkFfKopfncZeS6uP9le1gkvwsKA2QyGQHKyQrKruQmW',
    'Vellore',
    'admin@vit.ac.in',
    '100000003',
    'IDIB000V086',
    'Bank 3',
    TRUE
),
(
    '176b640c-3a40-4ef7-abb9-caca00000004',
    'College of Engineering Pune (COEP)',
    'COEP-004',
    '$2b$10$0HgdQpuYo6SIBInkLH50Ou0g7gOySRh1Ebd9z5WGQzLsjjfyGmAT6',
    'Pune',
    'admin@coep.ac.in',
    '100000004',
    'SBIN0001004',
    'Bank 4',
    TRUE
),
(
    '176b640c-3a40-4ef7-abb9-caca00000005',
    'SRM Institute of Science and Technology',
    'SRM-005',
    '$2b$10$jY6Q7mwVyWfH7PTWIIMXhO.091OktdSelPRCZQKgk9wduJhNeNpBm',
    'Chennai',
    'admin@srmist.edu.in',
    '100000005',
    'SBIN0001005',
    'Bank 5',
    TRUE
),
(
    '176b640c-3a40-4ef7-abb9-caca00000006',
    'NIT, Tiruchirappalli',
    'NITT-006',
    '$2b$10$Mkbw0390jHwUPQr7wKRaRefrIyynjvKbOkwl9fJSkRKlLTinQnTAO',
    'Trichy',
    'admin@nitt.edu',
    '100000006',
    'SBIN0001006',
    'Bank 6',
    TRUE
),
(
    '176b640c-3a40-4ef7-abb9-caca00000007',
    'BITS, Pilani',
    'BITS-007',
    '$2b$10$.oHBO/Uik2Kpzo5xQwAlq..7qq6PbU35auHofhFkOMMMoRXAmrFiK',
    'Pilani',
    'admin@bits-pilani.ac.in',
    '100000007',
    'ICIC0000312',
    'Bank 7',
    TRUE
),
(
    '176b640c-3a40-4ef7-abb9-caca00000008',
    'IIT Delhi',
    'IIT_DELHI',
    '$2b$10$52JFy0bsFLsWre2TCm8yju8wGg9N9w69KH/zM1kTrpIAXCCSdJP6S',
    'Delhi',
    'admin@iitd.ac.in',
    '100000008',
    'SBIN0001077',
    'Bank 8',
    TRUE
),
(
    '176b640c-3a40-4ef7-abb9-caca00000009',
    'IIM Ahmedabad',
    'IIM_AHMEDABAD',
    '$2b$10$0tjVY5QsiqGqD5L55kjSLuJMkMckjCfFZkYd7u5z2Qt1DM1HcgUF6',
    'Ahmedabad',
    'admin@iima.ac.in',
    '100000009',
    'HDFC0000006',
    'Bank 9',
    TRUE
),
(
    '176b640c-3a40-4ef7-abb9-caca00000010',
    'Dummy College',
    'DUMMY-011',
    '$2b$10$oguFLkEqxKdP5coAW3A2gu75tJuOaZw/pgG35nUYOoaERgt93t8am',
    'Dummy City',
    'admin@dummy.edu',
    '100000010',
    'SBIN0001011',
    'Bank 10',
    TRUE
),
(
    '176b640c-3a40-4ef7-abb9-caca00000011',
    'IIT Bombay',
    'IIT_BOMBAY',
    '$2b$10$ZJcDzQo4/obVd3SV.zffWOMykFK2giNF726ofbsFAmzGw7viqwUCm',
    'Mumbai',
    'admin@iitb.ac.in',
    '100000011',
    'SBIN0001111',
    'Bank 11',
    TRUE
),
(
    '176b640c-3a40-4ef7-abb9-caca00000012',
    'IIT Madras',
    'IIT_MADRAS',
    '$2b$10$vEEmQdnpO/KGr9j2gyF1EOFlX1RcWmYSkvHezbrnsH3twXCfUvG42',
    'Chennai',
    'admin@iitm.ac.in',
    '100000012',
    'SBIN0002222',
    'Bank 12',
    TRUE
),
(
    '176b640c-3a40-4ef7-abb9-caca00000013',
    'IIM Bangalore',
    'IIM_BANGALORE',
    '$2b$10$QcdM2Sr2lGUVxTM4JEjdZejpJvlobbO5fDOQ8nwL/8R21DIeo6B92',
    'Bangalore',
    'admin@iimb.ac.in',
    '100000013',
    'HDFC0003333',
    'Bank 13',
    TRUE
),
(
    '176b640c-3a40-4ef7-abb9-caca00000014',
    'IIT Patna',
    'IIT_PATNA',
    '$2b$10$Jnjpi9YYIKzmDJt65jvNNuOVtyw/3zO7AtvXeHi5n3baLNbC6xm2W',
    'Patna',
    'admin@iitp.ac.in',
    '100000014',
    'SBIN0004444',
    'Bank 14',
    TRUE
),
(
    '176b640c-3a40-4ef7-abb9-caca00000015',
    'NIT Patna',
    'NIT_PATNA',
    '$2b$10$ygtYkfz4RgHUzhTPgtHrJOhqwabdcKbS2DqpymVya4B1hVn4j7mRu',
    'Patna',
    'admin@nitp.ac.in',
    '100000015',
    'SBIN0005555',
    'Bank 15',
    TRUE
),
(
    '176b640c-3a40-4ef7-abb9-caca00000016',
    'IIT Hyderabad',
    'IIT_HYDERABAD',
    '$2b$10$ecJZPDLlhCCLe4XUlVXRteuXFsBlSZ8T.uRspCsBn2GwzidaAf0Ye',
    'Hyderabad',
    'admin@iith.ac.in',
    '100000016',
    'SBIN0006666',
    'Bank 16',
    TRUE
)
ON CONFLICT (code) DO NOTHING;


-- 2. Insert Institution Admin Users
INSERT INTO users (user_id, institution_id, full_name, email, mobile_number, password_hash, role, college_roll_number, kyc_status)
VALUES 
(
    'a4444444-4444-4444-a444-444444000001',
    '176b640c-3a40-4ef7-abb9-caca00000001',
    'Apex Admin',
    'admin@apex.edu.in',
    '9000000001',
    '$2b$10$/NT4zOmSvh5Gapfo8AyfJue3EBPcV46vp.dPU7UeYmDIbjAh7sIHu',
    'INSTITUTION_ADMIN',
    'ADMIN_APEX_001',
    'VERIFIED'
),
(
    'a4444444-4444-4444-a444-444444000002',
    '176b640c-3a40-4ef7-abb9-caca00000002',
    'Manipal Admin',
    'admin@manipal.edu',
    '9000000002',
    '$2b$10$NdPYp3nXKCuaXv6l2bEhrOn3lla.SK7VpA9C06yc8YfVnVoOFFmDO',
    'INSTITUTION_ADMIN',
    'ADMIN_MIT_002',
    'VERIFIED'
),
(
    'a4444444-4444-4444-a444-444444000003',
    '176b640c-3a40-4ef7-abb9-caca00000003',
    'Vellore Admin',
    'admin@vit.ac.in',
    '9000000003',
    '$2b$10$SATl1awFJ5SkFfKopfncZeS6uP9le1gkvwsKA2QyGQHKyQrKruQmW',
    'INSTITUTION_ADMIN',
    'ADMIN_VIT_003',
    'VERIFIED'
),
(
    'a4444444-4444-4444-a444-444444000004',
    '176b640c-3a40-4ef7-abb9-caca00000004',
    'College Admin',
    'admin@coep.ac.in',
    '9000000004',
    '$2b$10$0HgdQpuYo6SIBInkLH50Ou0g7gOySRh1Ebd9z5WGQzLsjjfyGmAT6',
    'INSTITUTION_ADMIN',
    'ADMIN_COEP_004',
    'VERIFIED'
),
(
    'a4444444-4444-4444-a444-444444000005',
    '176b640c-3a40-4ef7-abb9-caca00000005',
    'SRM Admin',
    'admin@srmist.edu.in',
    '9000000005',
    '$2b$10$jY6Q7mwVyWfH7PTWIIMXhO.091OktdSelPRCZQKgk9wduJhNeNpBm',
    'INSTITUTION_ADMIN',
    'ADMIN_SRM_005',
    'VERIFIED'
),
(
    'a4444444-4444-4444-a444-444444000006',
    '176b640c-3a40-4ef7-abb9-caca00000006',
    'NIT, Admin',
    'admin@nitt.edu',
    '9000000006',
    '$2b$10$Mkbw0390jHwUPQr7wKRaRefrIyynjvKbOkwl9fJSkRKlLTinQnTAO',
    'INSTITUTION_ADMIN',
    'ADMIN_NITT_006',
    'VERIFIED'
),
(
    'a4444444-4444-4444-a444-444444000007',
    '176b640c-3a40-4ef7-abb9-caca00000007',
    'BITS, Admin',
    'admin@bits-pilani.ac.in',
    '9000000007',
    '$2b$10$.oHBO/Uik2Kpzo5xQwAlq..7qq6PbU35auHofhFkOMMMoRXAmrFiK',
    'INSTITUTION_ADMIN',
    'ADMIN_BITS_007',
    'VERIFIED'
),
(
    'a4444444-4444-4444-a444-444444000008',
    '176b640c-3a40-4ef7-abb9-caca00000008',
    'IIT Admin',
    'admin@iitd.ac.in',
    '9000000008',
    '$2b$10$52JFy0bsFLsWre2TCm8yju8wGg9N9w69KH/zM1kTrpIAXCCSdJP6S',
    'INSTITUTION_ADMIN',
    'ADMIN_IIT_DELHI',
    'VERIFIED'
),
(
    'a4444444-4444-4444-a444-444444000009',
    '176b640c-3a40-4ef7-abb9-caca00000009',
    'IIM Admin',
    'admin@iima.ac.in',
    '9000000009',
    '$2b$10$0tjVY5QsiqGqD5L55kjSLuJMkMckjCfFZkYd7u5z2Qt1DM1HcgUF6',
    'INSTITUTION_ADMIN',
    'ADMIN_IIM_AHMEDABAD',
    'VERIFIED'
),
(
    'a4444444-4444-4444-a444-444444000010',
    '176b640c-3a40-4ef7-abb9-caca00000010',
    'Dummy Admin',
    'admin@dummy.edu',
    '9000000010',
    '$2b$10$oguFLkEqxKdP5coAW3A2gu75tJuOaZw/pgG35nUYOoaERgt93t8am',
    'INSTITUTION_ADMIN',
    'ADMIN_DUMMY_011',
    'VERIFIED'
),
(
    'a4444444-4444-4444-a444-444444000011',
    '176b640c-3a40-4ef7-abb9-caca00000011',
    'IIT Admin',
    'admin@iitb.ac.in',
    '9000000011',
    '$2b$10$ZJcDzQo4/obVd3SV.zffWOMykFK2giNF726ofbsFAmzGw7viqwUCm',
    'INSTITUTION_ADMIN',
    'ADMIN_IIT_BOMBAY',
    'VERIFIED'
),
(
    'a4444444-4444-4444-a444-444444000012',
    '176b640c-3a40-4ef7-abb9-caca00000012',
    'IIT Admin',
    'admin@iitm.ac.in',
    '9000000012',
    '$2b$10$vEEmQdnpO/KGr9j2gyF1EOFlX1RcWmYSkvHezbrnsH3twXCfUvG42',
    'INSTITUTION_ADMIN',
    'ADMIN_IIT_MADRAS',
    'VERIFIED'
),
(
    'a4444444-4444-4444-a444-444444000013',
    '176b640c-3a40-4ef7-abb9-caca00000013',
    'IIM Admin',
    'admin@iimb.ac.in',
    '9000000013',
    '$2b$10$QcdM2Sr2lGUVxTM4JEjdZejpJvlobbO5fDOQ8nwL/8R21DIeo6B92',
    'INSTITUTION_ADMIN',
    'ADMIN_IIM_BANGALORE',
    'VERIFIED'
),
(
    'a4444444-4444-4444-a444-444444000014',
    '176b640c-3a40-4ef7-abb9-caca00000014',
    'IIT Admin',
    'admin@iitp.ac.in',
    '9000000014',
    '$2b$10$Jnjpi9YYIKzmDJt65jvNNuOVtyw/3zO7AtvXeHi5n3baLNbC6xm2W',
    'INSTITUTION_ADMIN',
    'ADMIN_IIT_PATNA',
    'VERIFIED'
),
(
    'a4444444-4444-4444-a444-444444000015',
    '176b640c-3a40-4ef7-abb9-caca00000015',
    'NIT Admin',
    'admin@nitp.ac.in',
    '9000000015',
    '$2b$10$ygtYkfz4RgHUzhTPgtHrJOhqwabdcKbS2DqpymVya4B1hVn4j7mRu',
    'INSTITUTION_ADMIN',
    'ADMIN_NIT_PATNA',
    'VERIFIED'
),
(
    'a4444444-4444-4444-a444-444444000016',
    '176b640c-3a40-4ef7-abb9-caca00000016',
    'IIT Admin',
    'admin@iith.ac.in',
    '9000000016',
    '$2b$10$ecJZPDLlhCCLe4XUlVXRteuXFsBlSZ8T.uRspCsBn2GwzidaAf0Ye',
    'INSTITUTION_ADMIN',
    'ADMIN_IIT_HYDERABAD',
    'VERIFIED'
)
ON CONFLICT (email) DO NOTHING;

