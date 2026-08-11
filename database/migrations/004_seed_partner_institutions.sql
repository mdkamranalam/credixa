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
    '$2b$10$6HE9mPGr/lA7Jqq62HsWZO.PtAhMWFXZJQeMY3OqMYdv1riAwv7Xy',
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
    '$2b$10$OdBBVsPAt23rtDlZFSULz.A4TbRq4PgFRWvlGHffx34p4gp5cgcee',
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
    '$2b$10$udNiL8vU8yuOnEJNk2TXGuY2G7hTMMR8KLPQh5Ubmoq2drbLeUOYe',
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
    '$2b$10$PKmoMf27h1FkJ.O1Rh5CmuHv/0b2Yod6yP/rx7ouT6o4/SWd3kGka',
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
    '$2b$10$pz5ClRfc7UioSQD4HhPvxeXL4mMAt68Gm8V.3kRjLc16PjD4gmWFa',
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
    '$2b$10$RVKnssx19XT8RXX2i28zO.BGOnccJWZg7gx3EsnDv1AKPuNaODIpG',
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
    '$2b$10$qBUtgvH8wc1xAjmuGC9DUepGDJ4BKHzHyTku43pqd9oC.wxj2CjYi',
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
    '$2b$10$rIIGLojo1ICpZ5BfSUyD/ebOzQ6pqFMKQnR/BXHu1iv5QmFLv9Wka',
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
    '$2b$10$8DTFA1RLLUgQVwOQwVYm5e13Xj8V/hzgpTsCHaH1gjOsGlfOAhxR2',
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
    '$2b$10$9/JmoNachpx3GGvSts8dW.dhmGL9HHWoL91nvHEaC8ICMK.YjPKCW',
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
    '$2b$10$3QImfwQxlHH3IVEWEf4ktewWO0tzePbUjhOppG.pLXOOSElU3h8De',
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
    '$2b$10$YLP2aDdISIT6cEGGk7Zx8uHwc9cKGi4sbIoK04uRq4wnDx4FS5Sf.',
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
    '$2b$10$1vCo8ssjp.Qmev8Nc9HLMucOF3v.R0LUYgMeVdIZUG5gRR974CD1y',
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
    '$2b$10$leatJdAUnod6kuKjycgnAuo1CnmDvUvWu0z40G5xh8yfAyNQsqSnO',
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
    '$2b$10$n/qQYhxVOOvEAYujI0tEbOkZTmm2bDkPqBY.V7EcR7gi7kTH8shL2',
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
    '$2b$10$3yEpnrkbvJOr557PHZkLQe6FGif7O/oMM5z9R7x0lROI4SxIWHNLS',
    'Hyderabad',
    'admin@iith.ac.in',
    '100000016',
    'SBIN0006666',
    'Bank 16',
    TRUE
),
(
    '176b640c-3a40-4ef7-abb9-caca00000017',
    'Thapar Institute of Engineering & Technology',
    'THAPAR-017',
    '$2b$10$bq8m0yOlHAa0bU6CQ1A0z.TpPWk4/8dIuFAUOMSITInIrxSYpyMca',
    'Patiala',
    'admin@thapar.edu',
    '100000017',
    'SBIN0001017',
    'Bank 17',
    TRUE
),
(
    '176b640c-3a40-4ef7-abb9-caca00000018',
    'Amrita Vishwa Vidyapeetham',
    'AMRITA-018',
    '$2b$10$XszPswOASGU3l2VNroeRr.w2VKEgpEQ4F9WFkJn/3dBMLWbIwLhLq',
    'Coimbatore',
    'admin@amrita.edu',
    '100000018',
    'SBIN0001018',
    'Bank 18',
    TRUE
),
(
    '176b640c-3a40-4ef7-abb9-caca00000019',
    'IIIT Hyderabad',
    'IIITH-019',
    '$2b$10$g382U3aX.6X2DDI77zu6Z.mBzsWBmNiP.Xpwx0pAngZvMIQFimW6S',
    'Hyderabad',
    'admin@iiit.ac.in',
    '100000019',
    'SBIN0001019',
    'Bank 19',
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
    '$2b$10$6HE9mPGr/lA7Jqq62HsWZO.PtAhMWFXZJQeMY3OqMYdv1riAwv7Xy',
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
    '$2b$10$OdBBVsPAt23rtDlZFSULz.A4TbRq4PgFRWvlGHffx34p4gp5cgcee',
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
    '$2b$10$udNiL8vU8yuOnEJNk2TXGuY2G7hTMMR8KLPQh5Ubmoq2drbLeUOYe',
    'INSTITUTION_ADMIN',
    'ADMIN_VIT_003',
    'VERIFIED'
),
(
    'a4444444-4444-4444-a444-444444000004',
    '176b640c-3a40-4ef7-abb9-caca00000004',
    'COEP Admin',
    'admin@coep.ac.in',
    '9000000004',
    '$2b$10$PKmoMf27h1FkJ.O1Rh5CmuHv/0b2Yod6yP/rx7ouT6o4/SWd3kGka',
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
    '$2b$10$pz5ClRfc7UioSQD4HhPvxeXL4mMAt68Gm8V.3kRjLc16PjD4gmWFa',
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
    '$2b$10$RVKnssx19XT8RXX2i28zO.BGOnccJWZg7gx3EsnDv1AKPuNaODIpG',
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
    '$2b$10$qBUtgvH8wc1xAjmuGC9DUepGDJ4BKHzHyTku43pqd9oC.wxj2CjYi',
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
    '$2b$10$rIIGLojo1ICpZ5BfSUyD/ebOzQ6pqFMKQnR/BXHu1iv5QmFLv9Wka',
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
    '$2b$10$8DTFA1RLLUgQVwOQwVYm5e13Xj8V/hzgpTsCHaH1gjOsGlfOAhxR2',
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
    '$2b$10$9/JmoNachpx3GGvSts8dW.dhmGL9HHWoL91nvHEaC8ICMK.YjPKCW',
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
    '$2b$10$3QImfwQxlHH3IVEWEf4ktewWO0tzePbUjhOppG.pLXOOSElU3h8De',
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
    '$2b$10$YLP2aDdISIT6cEGGk7Zx8uHwc9cKGi4sbIoK04uRq4wnDx4FS5Sf.',
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
    '$2b$10$1vCo8ssjp.Qmev8Nc9HLMucOF3v.R0LUYgMeVdIZUG5gRR974CD1y',
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
    '$2b$10$leatJdAUnod6kuKjycgnAuo1CnmDvUvWu0z40G5xh8yfAyNQsqSnO',
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
    '$2b$10$n/qQYhxVOOvEAYujI0tEbOkZTmm2bDkPqBY.V7EcR7gi7kTH8shL2',
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
    '$2b$10$3yEpnrkbvJOr557PHZkLQe6FGif7O/oMM5z9R7x0lROI4SxIWHNLS',
    'INSTITUTION_ADMIN',
    'ADMIN_IIT_HYDERABAD',
    'VERIFIED'
),
(
    'a4444444-4444-4444-a444-444444000017',
    '176b640c-3a40-4ef7-abb9-caca00000017',
    'Thapar Admin',
    'admin@thapar.edu',
    '9000000017',
    '$2b$10$bq8m0yOlHAa0bU6CQ1A0z.TpPWk4/8dIuFAUOMSITInIrxSYpyMca',
    'INSTITUTION_ADMIN',
    'ADMIN_THAPAR_017',
    'VERIFIED'
),
(
    'a4444444-4444-4444-a444-444444000018',
    '176b640c-3a40-4ef7-abb9-caca00000018',
    'Amrita Admin',
    'admin@amrita.edu',
    '9000000018',
    '$2b$10$XszPswOASGU3l2VNroeRr.w2VKEgpEQ4F9WFkJn/3dBMLWbIwLhLq',
    'INSTITUTION_ADMIN',
    'ADMIN_AMRITA_018',
    'VERIFIED'
),
(
    'a4444444-4444-4444-a444-444444000019',
    '176b640c-3a40-4ef7-abb9-caca00000019',
    'IIIT Admin',
    'admin@iiit.ac.in',
    '9000000019',
    '$2b$10$g382U3aX.6X2DDI77zu6Z.mBzsWBmNiP.Xpwx0pAngZvMIQFimW6S',
    'INSTITUTION_ADMIN',
    'ADMIN_IIITH_019',
    'VERIFIED'
)
ON CONFLICT (email) DO NOTHING;

