-- Update all admin passwords to match testing docs in the database

-- Apex
UPDATE users SET password_hash = '$2b$10$fU.K9ti8nOqdcnDqYgkttuj0XsgzbKl8rHRHUMdQ6Bv6iGD.FfGoe' WHERE email IN ('admin@apex.edu.in');
UPDATE institutions SET password_hash = '$2b$10$fU.K9ti8nOqdcnDqYgkttuj0XsgzbKl8rHRHUMdQ6Bv6iGD.FfGoe' WHERE contact_email IN ('admin@apex.edu.in') OR code = 'APEX-001';

-- MIT
UPDATE users SET password_hash = '$2b$10$Im4jJALdcfD8WjQxVYluzOXUp5CR4YCPzXFVx4mGqESRQpPI71et.' WHERE email IN ('admin@manipal.edu');
UPDATE institutions SET password_hash = '$2b$10$Im4jJALdcfD8WjQxVYluzOXUp5CR4YCPzXFVx4mGqESRQpPI71et.' WHERE contact_email IN ('admin@manipal.edu') OR code = 'MIT-002';

-- VIT
UPDATE users SET password_hash = '$2b$10$scgK0mohx.fiqI3.PjcveOvqbYF3pj.OGQSH.7nbt1fcQD9feuZ8K' WHERE email IN ('admin@vit.ac.in');
UPDATE institutions SET password_hash = '$2b$10$scgK0mohx.fiqI3.PjcveOvqbYF3pj.OGQSH.7nbt1fcQD9feuZ8K' WHERE contact_email IN ('admin@vit.ac.in') OR code = 'VIT-003' OR code = 'VIT_VELLORE';

-- COEP
UPDATE users SET password_hash = '$2b$10$qZMbV4I1pqcI7hBAh.rVLuF/VeunhM8bCr7SUFwGRArRf85m2qrBW' WHERE email IN ('admin@coep.ac.in');
UPDATE institutions SET password_hash = '$2b$10$qZMbV4I1pqcI7hBAh.rVLuF/VeunhM8bCr7SUFwGRArRf85m2qrBW' WHERE contact_email IN ('admin@coep.ac.in') OR code = 'COEP-004';

-- SRM
UPDATE users SET password_hash = '$2b$10$t64GS64rMsWg0XqMLZ0VZOJZITVSoHEACGzozK9fHEHJ8L66PkYiq' WHERE email IN ('admin@srmist.edu.in');
UPDATE institutions SET password_hash = '$2b$10$t64GS64rMsWg0XqMLZ0VZOJZITVSoHEACGzozK9fHEHJ8L66PkYiq' WHERE contact_email IN ('admin@srmist.edu.in') OR code = 'SRM-005';

-- NITT
UPDATE users SET password_hash = '$2b$10$XKHL6zND4B4Kj/mWy/SCJuvb.er.vHf3MkwZCpFgqi97WsuvJou2q' WHERE email IN ('admin@nitt.edu');
UPDATE institutions SET password_hash = '$2b$10$XKHL6zND4B4Kj/mWy/SCJuvb.er.vHf3MkwZCpFgqi97WsuvJou2q' WHERE contact_email IN ('admin@nitt.edu') OR code = 'NITT-006';

-- BITS
UPDATE users SET password_hash = '$2b$10$knZOTa6vRC5/Ag1FQ84cU.JJ3IsWnCtFUY3TX9IybHtTaQ6uIKSJe' WHERE email IN ('admin@pilani.bits-pilani.ac.in', 'admin@bits-pilani.ac.in');
UPDATE institutions SET password_hash = '$2b$10$knZOTa6vRC5/Ag1FQ84cU.JJ3IsWnCtFUY3TX9IybHtTaQ6uIKSJe' WHERE contact_email IN ('admin@pilani.bits-pilani.ac.in', 'finance@bits-pilani.ac.in') OR code = 'BITS-007' OR code = 'BITS_PILANI';

-- Update the email for BITS to match the test docs exactly if it doesn't already, but we'll just update password for both.
