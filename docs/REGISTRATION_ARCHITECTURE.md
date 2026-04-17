# Credixa 5-Step Registration Process Architecture

This document describes the production-grade breakdown of the 5-step registration process, including the frontend UI/UX requirements, backend API/integration details, and database transactions required for a secure, robust fintech application.

## Step 1: Basic Authentication (The Gateway)
The student lands on the Credixa platform to establish their digital identity and secure their session.

**Frontend (React + TypeScript):**
- Strictly validates inputs (e.g., exactly 10 digits for the phone number).
- Incorporates a dynamic password strength meter.
- Requires an `institution_code` via dropdown or exact input to link the student immediately to a registered college.

**Data Collected:**
- Full Name, Email, Phone Number, Password, College Roll Number, Date of Birth.

**Backend Action (Node.js/Express):**
- Enforces rate-limiting to prevent bot spam and DDoS.
- Hashes and salts passwords via `bcrypt` (minimum 10-12 rounds).
- Issues a JSON Web Token (JWT) with `user_id` and `role` (Student), ideally set as an `HttpOnly` secure cookie.

**Database Transaction:**
- Inserts record into `users` table with `kyc_status` defaulting to `'PENDING'`.

---

## Step 2: Identity Verification (Trust Stack Layer 1)
Upon successful basic auth, the student must undergo identity verification before accessing core lending tools.

**Frontend (React + TypeScript):**
- Secure modal requires both Aadhaar and PAN inputs.
- Employs visually masked inputs for Aadhaar (`XXXX-XXXX-1234`).

**Data Collected:**
- PAN Number, Aadhaar Number.

**Backend Action (Node.js/Express):**
- Fires a request (REST or gRPC) to the isolated **Regulatory Simulator** microservice.
- The Simulator enforces artificial latency (e.g., 50ms) to mirror IndiaStack APIs before returning a successful `200 OK`.
- Encrypts Aadhaar numbers (AES-256-GCM) on the Node server *before* recording to the database.

**Database Transaction:**
- Updates `users` table:
  - `kyc_status`: `'VERIFIED'`
  - `kyc_source`: `'INDIASTACK_SIMULATION'`
  - Saves encrypted `aadhaar_hash` and plaintext `pan_number`.

---

## Step 3: Co-Applicant Linking (3NF Compliance)
Since students generally have a "thin-file" lacking mature credit histories, a guarantor is mandatory to underwrite lending risks.

**Frontend (React + TypeScript):**
- A dynamic form selects guarantor relationship (e.g., Parent/Guardian).
- Includes educational tooltips explaining the necessity of a guarantor for educational BNPL.

**Data Collected:**
- Guarantor Name, Relationship, Guarantor PAN, Guarantor Aadhaar, Income Type (Salaried/Self-Employed), Monthly Income.

**Backend Action (Node.js/Express):**
- Server-side validations for guarantor age limits and valid income configurations.
- Encrypts both the guarantor's Aadhaar and PAN using standard AES-256-GCM.

**Database Transaction:**
- Inserts relationship and securely handled properties into the `co_applicants` table, linked back by `user_id`.

---

## Step 4: Financial Data Ingestion (Trust Stack Layers 2 & 3)
Requires ingesting historical cash-flow data into the AI Risk Engine for underwriting.

### Path A: The Hot Path (Sahamati AA)
- **Frontend:** Student supplies their Account Aggregator handle (e.g., `student@onemoney`).
- **Backend:** Node pings the Regulatory Simulator, which replies with a robust, structured JSON payload denoting 6 months of historical transactions.

### Path B: The Fallback Path (Upload & OCR)
- **Frontend:** A drag-and-drop zone handling `.pdf`, `.png`, or `.jpg` uploads via `multipart/form-data` with progress indicators.
- **Backend:** Node.js buffers and streams the file to a specialized Python FastAPI service.
  - Python employs `pdfplumber` for tabular PDF extraction.
  - Python uses Tesseract OCR for scanned images.
- **Database Transaction:** Inserts into `loan_documents`, updating properties: `file_url`, `extraction_method` (`SAHAMATI_JSON`, `PDF_PLUMBER`, or `TESSERACT_OCR`), and an `extraction_confidence` score.

---

## Step 5: AI Omniscore Generation
Calculating an AI-powered proprietary credit rating from the gathered application features.

**Data Engineering (Python):**
- The FastAPI side builds a structured Feature Array indexing Average Monthly Balance, Income Consistency, Default Risk Flags, and related features.

**AI Model Execution:**
- A Scikit-Learn Random Forest model evaluates the standardized array.
- Uses `.predict_proba()` to scale probability-of-default into an `omniscore` (range: 0 - 900).

**Backend Action:**
- Python synchronously streams back the Omniscore, risk tier, and process latency to the Node.js API.

**Database Transaction:**
- Writes the calculation data and probability into the `risk_scores` table.

**Frontend (React + TypeScript):**
- Post-score generation, routes the user directly to a new comprehensive Dashboard.
- Incorporates dynamic visual feedback like an animated gauge chart mapping their new Omniscore and subsequently activating funding options like the "Apply for Loan" button.
