# Credixa Comprehensive Test Scenarios

This document outlines 10 core test scenarios for each primary user persona within the Credixa ecosystem: Students, Parents (Co-Applicants), and Educational Institutions. It also details the best formats and expected content for real-life documents used to test the AI Risk Engine and OCR digitization features.

---

## 1. Student Scenarios

1. **Onboarding Workflow Execution:** Verify that a student can successfully complete the 5-step onboarding process, including selecting their educational institution, specifying the financing semester, and inputting basic details.
2. **Academic Document OCR Digitization:** Upload a real-life PDF of an academic mark sheet and verify that the HuggingFace LLM Extractor accurately digitizes grades, institution name, and student ID.
3. **Fee Structure Validation:** Upload a university fee structure document and confirm the system correctly parses the total amount required for the semester.
4. **Co-Applicant Invitation:** Trigger the co-applicant invitation process and ensure an email/SMS with a secure link is sent to the parent's contact details.
5. **Real-Time Omniscore Evaluation:** Submit an application (with valid mock data) and verify the AI Risk Engine returns a real-time credit score (Omniscore) based on academic performance and other indicators.
6. **Repayment Schedule Transparency:** Access the student dashboard post-approval and verify the amortization schedule matches the approved loan amount with zero hidden fees.
7. **Application Status Tracking:** Monitor real-time status changes on the dashboard as the application moves from *Pending* -> *Under Review* -> *Approved* -> *Disbursed*.
8. **Subsequent Semester Financing:** Attempt to apply for a second semester's financing using existing digitized records to ensure a frictionless returning user experience.
9. **Early Repayment Simulation:** Simulate making an early, manual payment towards an upcoming installment and verify the remaining balance updates instantly.
10. **Exception Handling - Invalid Data:** Submit an application with a missing mandatory field (e.g., missing phone number) and verify the frontend and API Gateway return appropriate error messages.

---

## 2. Parent / Co-Applicant Scenarios

1. **Invite Link Registration:** Click the unique invitation link sent by the student, create a secure account, and link it successfully to the student's pending application.
2. **KYC Document Upload & Parsing:** Upload a government-issued ID (e.g., Passport, Driver's License) and verify the OCR pipeline correctly extracts the name, DOB, and address.
3. **Bank Statement Risk Analysis:** Upload 6 months of bank statements in PDF format and verify the XGBoost Classifier accurately processes the data (savings rate, DTI ratio).
4. **Fraud Detection Scrutiny:** Intentionally upload a tampered or mathematically inconsistent bank statement to trigger the AI Risk Engine's fraud flags and reject the document.
5. **Creditworthiness Assessment Review:** View the generated co-applicant risk profile and ensure it correctly reflects the uploaded financial data before final approval.
6. **Digital Loan Agreement Signing:** Review the final terms, interest rates (if applicable), and amortization schedule, and digitally sign the BNPL agreement.
7. **Auto-Pay Mandate Setup:** Successfully configure an auto-debit mandate linking a mock bank account for automated monthly installments.
8. **Installment Notification Delivery:** Trigger a mock "upcoming payment" event and verify the parent receives an automated email/SMS reminder 3 days prior to the due date.
9. **Dashboard Monitoring:** Log into the parent portal and accurately view the active credit line limit, current outstanding balance, and payment history.
10. **Credit Limit Increase Request:** Submit a request to increase the total BNPL credit limit for upcoming academic years and verify it enters the manual review queue.

---

## 3. Educational Institution Scenarios

1. **Partner Portal Authentication:** Log securely into the Partner Portal using institution admin credentials and view the aggregate dashboard of student enrollments.
2. **Student Enrollment Verification:** Review a pending student application and manually approve their academic records and enrollment status to unblock the loan.
3. **Discrepancy Rejection:** Flag a student's uploaded fee structure as incorrect or outdated, triggering a notification for the student to re-upload.
4. **Pending Disbursement Monitoring:** View a real-time list of all approved BNPL credit lines that are awaiting fund disbursement from Credixa to the institution.
5. **Payment Reconciliation:** Export a CSV/Excel report of disbursed funds and reconcile them against internal student accounts.
6. **Immutable Audit Log Review:** Access the audit log for a specific student's application to view a timeline of every state change, document upload, and approval event.
7. **Fee Structure Management:** Upload and update the institution's official fee structures for different courses for the upcoming academic year to serve as the baseline for student verifications.
8. **Role-Based Access Control (RBAC):** Create a new "Junior Admin" account with restricted permissions (e.g., can view applications but cannot approve disbursements) and verify access limits.
9. **Automated Webhook Reception:** Simulate receiving a secure webhook payload from Credixa's API Gateway confirming a successful batch disbursement of funds.
10. **Dashboard Analytics:** Verify that the dashboard accurately displays key metrics such as Total Active Students, Total Disbursed Volume, and Default Rates for the institution.

---

## 4. Real-Life Document Formats & Content for Testing

To properly test the OCR Digitization (HuggingFace LLM) and the AI Risk Engine (XGBoost), use documents formatted to replicate real-world variability.

### A. Academic Mark Sheet (PDF/JPEG)
*   **Best Format:** Scanned PDF or high-resolution image with a university letterhead.
*   **Expected Content:**
    *   Institution Name and Logo.
    *   Student Full Name and Roll/Registration Number.
    *   Course Name, Semester, and Academic Year.
    *   Tabular layout of Subjects, Maximum Marks, Marks Obtained, and Credits.
    *   Final CGPA / Percentage calculation.
    *   Official stamp and signature of the registrar.
*   **Test Focus:** The OCR should flawlessly extract the Student Name, Roll Number, and Final CGPA from complex tabular structures.

### B. Institutional Fee Structure (PDF)
*   **Best Format:** Official digital PDF generated by the university portal.
*   **Expected Content:**
    *   Institution Name and Department.
    *   Breakdown of fees: Tuition Fee, Library Fee, Hostel Fee, Examination Fee.
    *   Total Amount Payable.
    *   Due Date for payment.
    *   Bank account details of the institution.
*   **Test Focus:** Extraction of the "Total Amount Payable" and matching it against the student's requested loan amount.

### C. Bank Statements for Risk Engine (PDF)
*   **Best Format:** Digitally signed PDF downloaded directly from a mock bank portal (e.g., 6 months of transaction history).
*   **Expected Content:**
    *   Account Holder Name (must match Co-Applicant KYC) and Account Number.
    *   Opening and Closing Balances.
    *   Chronological list of transactions (Date, Description, Debit, Credit, Balance).
    *   *Specifically include:* Monthly salary credits, regular utility payments, and occasional large debits.
    *   *For Fraud Testing:* Include tampered dates, mismatched closing/opening balances between pages, or simulated gambling/high-risk merchant codes.
*   **Test Focus:** The AI Risk Engine must parse transaction velocity, calculate the Debt-to-Income (DTI) ratio, evaluate savings rates, and flag anomalies or specific risk indicators.

### D. KYC / Government ID (JPEG/PNG)
*   **Best Format:** Photo of a physical ID card under varied lighting conditions.
*   **Expected Content:**
    *   Full Legal Name.
    *   Date of Birth.
    *   Unique ID Number (e.g., Aadhaar, PAN, Voter ID, Passport Number).
    *   Residential Address.
*   **Test Focus:** OCR robustness against glare, blur, and varied fonts. Extraction of Name and Address to cross-verify against the bank statement and application form.

---

## 5. End-to-End (E2E) Integration Scenarios & Mock Document Specifications

1. **Happy Path - Seamless Approval & Instant Disbursement (Rahul Sharma):** 
   - **Student Profile:** Rahul Sharma | **Co-Applicants:** Rajesh Sharma (Father), Priya Sharma (Mother) | **Institution:** IIT Delhi
   - **Flow:** Student initiates application -> Parent uploads KYC & Bank Statements -> AI assigns high Omniscore -> Institution verifies -> Auto-approval & disbursement.
   - **Mock Documents Required:**
     - *Student Mark Sheets (`10th_marksheet.pdf`, `12th_marksheet.pdf`):* Name: Rahul Sharma, CBSE Board, 95.2% Class XII aggregate.
     - *Fee Structure (`rahul_fee_structure_happy.pdf`):* ₹2,50,000 Total Semester-I Payable, due in 30 days.
     - *Parent KYC (`test_coapplicant_mother_kyc_raw.pdf`):* Name: Priya Sharma, clear photo, matches address on bank statement.
     - *Parent Bank Statement (`rahul's_mother_bank_statement.pdf`):* 6 months history. Starting balance ₹10,00,000, regular ₹60,000 monthly salary credits, closing balance ₹13,00,000. No loan defaults.

2. **Unhappy Path - High-Risk Co-Applicant Rejection due to High DTI (Kamran Khan):**
   - **Student Profile:** Kamran Khan | **Co-Applicants:** Tariq Khan (Father), Yasmin Khan (Mother) | **Institution:** MIT Manipal
   - **Flow:** Student completes perfectly -> Parent uploads Bank Statement showing severe liquidity stress and high debt burden -> AI Risk Engine rejects with low Omniscore (<500).
   - **Mock Documents Required:**
     - *Parent Bank Statement (`kamran's_father_bank_statement.pdf`):* Tariq Khan (Retail Proprietor). ₹45,000 monthly retail sales receipt, ₹41,000 in existing EMI/loan deductions (Bajaj Finserv Personal Loan, HDFC Car Loan EMI, Muthoot Gold Loan Interest), closing balance ₹500. High velocity of withdrawals demonstrating severe liquidity stress (DTI > 91%).

3. **Unhappy Path - Suspected Fraud & Document Tampering (Harpreet Singh):**
   - **Student Profile:** Harpreet Singh | **Co-Applicants:** Daljit Singh (Father), Manpreet Kaur (Mother) | **Institution:** VIT Vellore
   - **Flow:** Parent uploads manipulated bank statement -> AI detects mathematical impossibilities and forged dates -> System locks application instantly and flags for manual investigation.
   - **Mock Documents Required:**
     - *Tampered Bank Statement (`harpreet's_father_bank_statement_TAMPERED.pdf`):* Daljit Singh (Textile Trader). Page 1 closing balance is ₹4,50,000, but Page 2 starting balance brought forward is ₹14,50,000 (mathematical impossibility: +₹10,00,000 without credit entry). Forged or illegal calendar dates: `30-Feb-2026` and `31-Apr-2026`.

4. **Edge Case - Discrepancy Resolution Loop via Document Re-upload (Rhea D'Souza):**
   - **Student Profile:** Rhea D'Souza | **Co-Applicants:** Maria D'Souza (Mother), Michael D'Souza (Father) | **Institution:** COEP Technological University, Pune
   - **Flow:** Student uploads blurry/unreadable Fee Structure -> Institution rejects document -> Student re-uploads crystal clear version -> Institution approves.
   - **Mock Documents Required:**
     - *Document 1 - Blurry/Rejected (`rhea_fee_structure_REJECTED.jpeg`):* Extremely low resolution, pixelated JPEG of COEP Fee Structure with unreadable OCR text (`C##P T#CHN#L#G#C#L UN#V#RS#TY`).
     - *Document 2 - Clear/Approved (`rhea_fee_structure_APPROVED.pdf`):* High-quality, pristine PDF of COEP Fee Structure showing ₹3,80,000 Total Payable.

5. **Edge Case - Parent Drops Off & Session Abandonment Recovery (Rohan Mehta):**
   - **Student Profile:** Rohan Mehta | **Co-Applicants:** Suresh Mehta (Father), Bhavna Mehta (Mother) | **Institution:** SRM Institute of Science and Technology (SRMIST), Chennai
   - **Flow:** Student invites parent -> Parent clicks link but abandons session -> System sends automated 24/48 hr SMS/WhatsApp reminders -> Parent returns and completes application.
   - **Mock Documents Required:**
     - *Student Mark Sheets & Fee Structure (`rohan_fee_structure_happy.pdf`):* Valid mock documents (₹3,50,000 payable) pushing application forward to the "Waiting for Co-Applicant" state before recovery.

6. **Unhappy Path - Identity Mismatch & OCR Validation Failure (Pooja Nair):**
   - **Student Profile:** Pooja Nair | **Co-Applicants:** K. R. Nair (Father), Lakshmi Nair (Mother) | **Institution:** NIT Tiruchirappalli (NITT)
   - **Flow:** Parent uploads KYC that doesn't match the Bank Statement name -> OCR cross-verification fails -> System blocks progression until resolved.
   - **Mock Documents Required:**
     - *Parent KYC (`test_coapplicant_father_kyc_raw.pdf`):* Name reads "Amit Patel" (or mismatched identity upload).
     - *Parent Bank Statement (`pooja's_father_bank_statement_MISMATCH.pdf`):* Account holder name reads "K. R. Nair" (or joint firm name "Nair & Sons Enterprises"), causing an OCR name mismatch against the uploaded KYC.

7. **Edge Case - Partial Scholarship & Over-Borrowing Adjustment (Arjun Deshmukh):**
   - **Student Profile:** Arjun Deshmukh | **Co-Applicants:** Vandana Deshmukh (Mother), Prakash Deshmukh (Father) | **Institution:** BITS Pilani (Navi Mumbai Campus)
   - **Flow:** Student requests ₹10,00,000 loan -> Fee structure indicates a 50% merit scholarship bringing total to ₹5,00,000 -> AI/Institution flags over-borrowing attempt and auto-adjusts loan sanction to ₹5,00,000.
   - **Mock Documents Required:**
     - *Fee Structure (`arjun_fee_structure_scholarship.pdf`):* Shows ₹10,00,000 Base Tuition, a line item for -₹5,00,000 BITS Merit Scholarship, and ₹5,00,000 Final Total Payable.

8. **Unhappy Path - High-Risk Behaviour Pattern & Gambling Flags (Darius Mistry):**
   - **Student Profile:** Darius Mistry | **Co-Applicants:** Farokh Mistry (Father), Roshan Mistry (Mother) | **Institution:** Thapar Institute of Engineering & Technology, Patiala
   - **Flow:** Parent uploads Bank Statement -> AI detects frequent high-value transactions to known betting and fantasy gaming merchants -> Drastic Omniscore reduction & rejection.
   - **Mock Documents Required:**
     - *Parent Bank Statement (`darius's_father_bank_statement_GAMBLING.pdf`):* Farokh Mistry (VP Logistics, ₹2,50,000 monthly salary). Multiple regular high-frequency debits labeled "Dream11 Fantasy Sports", "Betway Online India", "Parimatch Casino", or "RummyCircle Games" accounting for >35% of monthly income (₹3,55,000 total gambling debits).

9. **Edge Case - Institution Delays Verification & SLA Escalation (Divya Iyer):**
   - **Student Profile:** Divya Iyer | **Co-Applicants:** S. Venkatraman Iyer (Father), Radhika Iyer (Mother) | **Institution:** Amrita Vishwa Vidyapeetham, Coimbatore
   - **Flow:** AI approves financial profile instantly -> Institution fails to verify enrollment within 7-day SLA window -> Automated escalation alerts and webhook nudges trigger to university admin.
   - **Mock Documents Required:**
     - *Standard Valid Documents (`divya_fee_structure_happy.pdf`, `divya's_father_bank_statement.pdf`):* Clean, pristine documents ensuring the application clears all AI Risk Engine checks with high Omniscore (950/1000) and rests purely on the Institution's verification queue.

10. **Happy Path - Multi-Semester Fast Track for Returning Users (Abbas Ali):**
    - **Student Profile:** Abbas Ali | **Co-Applicants:** Hyder Ali (Father), Fatima Ali (Mother) | **Institution:** International Institute of Information Technology (IIIT), Hyderabad
    - **Flow:** Student finishes repaying Semester I cleanly without defaults -> Applies for Semester II -> System bypasses KYC and Bank Statements, reusing verified baseline data -> Approved in <30 seconds upon uploading new Fee Structure.
    - **Mock Documents Required:**
      - *New Fee Structure (`abbas_fee_structure_semester2.pdf`):* Labeled "Semester II Fee Breakdown", ₹3,75,000 Total Payable. (Assumes Semester I repayment history and KYC baseline are already seeded in the database).
