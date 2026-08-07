UPDATE users SET password_hash = '$2b$10$WUVNui38wedCVunzvp2a2.r9PqvokoJ88pdEnBKfwnntGzn9tKHQi' WHERE email = 'admin@iitd.ac.in';
UPDATE users SET password_hash = '$2b$10$ksd/pce7eMW.T.9s5wiQs.EwvTXG/Xt.iqvhrYdfk0aC.BULRT8c6' WHERE email = 'admin@iima.ac.in';
UPDATE users SET password_hash = '$2b$10$N1ue.aEzGuWZfl6pmhb3TOJuy/0U7yllCwexfQMPYV/4kPQESuM2O' WHERE email = 'admin@dummy.edu';

UPDATE institutions SET password_hash = '$2b$10$WUVNui38wedCVunzvp2a2.r9PqvokoJ88pdEnBKfwnntGzn9tKHQi' WHERE contact_email = 'admin@iitd.ac.in' OR code = 'IIT_DELHI';
UPDATE institutions SET password_hash = '$2b$10$ksd/pce7eMW.T.9s5wiQs.EwvTXG/Xt.iqvhrYdfk0aC.BULRT8c6' WHERE contact_email = 'admin@iima.ac.in' OR code = 'IIM_AHMEDABAD';
UPDATE institutions SET password_hash = '$2b$10$N1ue.aEzGuWZfl6pmhb3TOJuy/0U7yllCwexfQMPYV/4kPQESuM2O' WHERE contact_email = 'admin@dummy.edu' OR code = 'DUMMY-011';
