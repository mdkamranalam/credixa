# 🎓 Project Summary: CREDIXA
### A Rapid Loan Disbursement Platform & Next-Gen Education BNPL with Autonomous Underwriting

---

## 📌 Submission & Candidate Metadata
* **Candidate Name:** Md Kamran Alam (Roll No: `2023EBCS351`)
* **Co-Author:** Devansh Jaiswal (Roll No: `2023EBCS328`)
* **Degree / Program:** B.Sc. in Computer Science (Online Mode)
* **Institution:** Birla Institute of Technology & Science (BITS), Pilani
* **Academic Supervisor:** Prof. Raj Kumar K.
* **Academic Year:** 2025–2026
* **Live Web Portal:** [https://credixa-8wlw.onrender.com/](https://credixa-8wlw.onrender.com/)
* **API Gateway Health:** [https://credixa-backend-7r4k.onrender.com/health](https://credixa-backend-7r4k.onrender.com/health)
* **AI Risk Engine Swagger:** [https://credixa-risk-engine.onrender.com/docs](https://credixa-risk-engine.onrender.com/docs)
* **GitHub Repository:** [https://github.com/mdkamranalam/credixa](https://github.com/mdkamranalam/credixa)

---

## 1. Executive Summary & Problem Statement

### The Problem
Rising educational costs create severe financial hurdles for deserving students. Traditional lending institutions rely almost exclusively on historical credit bureau scores (e.g., CIBIL, FICO). This creates the **"thin-file dilemma"**: students with high academic merit but zero prior borrowing history are systematically locked out or subjected to 14–21 days of bureaucratic paperwork and approval delays.

### The Solution
**Credixa** is a production-grade Buy Now Pay Later (BNPL) platform and autonomous credit underwriting ecosystem that democratizes educational financing. It replaces archaic credit checks with an AI-driven, real-time behavioral underwriting engine that evaluates non-traditional financial signals—including banking cash flows, Debt-to-Income (DTI) ratio, savings velocity, income regularity, and academic trajectory—to compute an inclusive 0–900 credit rating called the **Omniscore** in **under 60 seconds**.

---

## 2. 🌟 Unique Value Proposition (UVP)

> **"Credixa democratizes education financing by turning credit-invisible students into creditworthy borrowers through real-time (<60s) AI-driven behavioral underwriting (0–900 Omniscore), Explainable AI (XAI) transparency, and bank-grade zero-knowledge data privacy—replacing weeks of bureaucratic delays with instant, fair, and automated credit access."**

### Core Value Differentiators
1. **Thin-File Credit Inclusion:** Evaluates non-traditional behavioral markers (9-parameter feature vector) rather than relying on legacy credit bureau history.
2. **Sub-60-Second Turnaround:** End-to-end processing (OCR document digitization $\to$ XGBoost inference $\to$ repayment schedule generation) completed in $<60\text{s}$ (vs. 14–21 days in traditional banks).
3. **Dynamic Explainable AI (XAI):** Provides human-interpretable reasoning (pros/cons) for every automated credit decision to ensure transparency and trust.
4. **Bank-Grade Data Privacy & Deduplication:** Field-level `AES-256-GCM` encryption for PII, deterministic `HMAC-SHA256` indexing for $O(1)$ duplicate prevention, and automated regex PII redaction prior to external LLM calls.
5. **Regulatory-Compliant LSP/TSP Architecture:** Operates as a Technology & Lending Service Provider in co-lending alignment with regulated NBFC partners, eliminating balance-sheet capital risk.

---

## 3. Core System Architecture (The 5 Pillars)

```
[ Client Browser (React 19) ] ---> HTTPS / JWT Cookies
                                        |
                                        v
                            [ Node.js API Gateway (:3000) ]
                                |               |
           SQL Queries (ACID)   |               | REST (x-api-key)
                                v               v
                     [ Supabase PostgreSQL 16 ] [ FastAPI AI Risk Engine (:8000) ]
                                ^               |
             Session / RateLimit|               v
                     [ Managed Redis 7 ] <--- [ XGBoost Classifier + OCR ]
```

1. **Frontend Client (`frontend/`):** React 19, Vite, Tailwind CSS. Multi-tenant SPA (Student, Institutional Admin, Superadmin), 5-step applicant wizard, dynamic OCR manual-correction modal, and live Server-Sent Events (SSE) telemetry.
2. **API Gateway (`backend-gateway/`):** Node.js & Express. Central router handling dual-token auth (15m JWT + 7d HttpOnly cookie), Redis token blacklist revocation (`bl_${jti}`), role-based access control (RBAC), and 01:00 AM daily cron scheduling.
3. **AI Risk Engine (`risk-engine/`):** Python 3.11 & FastAPI. Multi-page PDF extraction (`pdfplumber` + Tesseract OCR fallback), 9-feature scaling, XGBoost ML classifier, and dynamic Explainable AI generation.
4. **Database Vault (`database/`):** PostgreSQL 16 (Supabase). 11 relational 3NF tables, UUID primary keys, custom ENUMs, AES-256-GCM encrypted PII, deterministic HMAC indexes, and atomic ACID ledgers with row-level locks.
5. **Session Cache (`Redis 7`):** Sliding-window IP rate limiting (5 req/15m on auth), revoked token storage, and SHA-256 PDF text caching for sub-50ms repeat inference.

---

## 4. Machine Learning & The Omniscore Algorithm

### 9-Feature Underwriting Vector
$$\mathbf{X} = [\text{avg\_balance}, \text{overdrafts}, \text{gambling\_flags}, \text{academic\_score}, \text{dti\_ratio}, \text{savings\_rate}, \text{income\_stability}, \text{fraud\_flag}, \text{name\_mismatch\_flag}]$$

* **Normalization:** Standardized via `StandardScaler` ($z = \frac{x - \mu}{\sigma}$).
* **Classifier:** `xgboost.XGBClassifier` (`n_estimators=300, max_depth=5, lr=0.05`).
* **Score Mapping:** $\text{Omniscore} = \text{round}(P(\text{Approved}) \times 900)$.
  * 🟢 **LOW RISK ($\ge 700$):** Instant approval, full credit line unlocked, 0% promotional BNPL schedule.
  * 🟡 **MEDIUM RISK ($500 - 699$):** Manual underwriter queue; secondary guarantor requested.
  * 🔴 **HIGH RISK ($< 500$):** Automated rejection with granular Explainable AI feedback.
* **Model Drift Monitoring:** Population Stability Index (PSI) tracking in `evaluate_drift.py`.

---

## 5. Security, Cryptography & Compliance

| Security Domain | Implementation in Credixa | Regulatory & Technical Benefit |
| :--- | :--- | :--- |
| **PII Encryption** | `AES-256-GCM` (`iv:authTag:ciphertext`) | Zero-knowledge protection for sensitive Aadhaar & PAN numbers at rest. |
| **$O(1)$ Deduplication** | Deterministic `HMAC-SHA256` | Instant duplicate account check via indexed column without table decryption. |
| **PII Redaction** | Regex Scrubber (`pii_redactor.py`) | Strips IDs, phones, and account numbers prior to external LLM calls (DPDP/GDPR compliant). |
| **Dual-Token Auth** | 15m JWT + 7d HttpOnly Cookie | Prevents XSS token theft; allows instant revocation via Redis blacklist. |
| **Inter-Service Auth** | `x-api-key` Header Validation | Strictly authenticates Gateway-to-Risk-Engine REST invocations. |

---

## 6. Quantitative Validation & Test Results

### Performance KPIs
* **XGBoost Classification Accuracy:** **94.2%**
* **AI Inference Latency:** **$< 2.8\text{ seconds}$**
* **End-to-End Decision Turnaround:** **$< 60\text{ seconds}$**
* **Pipeline Availability Uptime:** **99.9%** (with heuristic fallbacks)
* **Document Tamper Detection Rate:** **100%** (forged dates, ledger breaks)

### End-to-End Test Case Highlights
1. **TC-01 (Rahul Sharma - Happy Path):** Clean 6-month statements, 95.2% GPA $\to$ **Omniscore 850 (LOW_RISK)** $\to$ Instant ₹2,50,000 loan approval.
2. **TC-02 (Kamran Khan - High DTI Risk):** ₹45k income, ₹41k debt EMIs (DTI 91.1%) $\to$ **Omniscore 450 (HIGH_RISK)** $\to$ Auto-rejection with clear reasoning.
3. **TC-03 (Harpreet Singh - Tamper & Fraud):** ₹10L balance jump without credit entry, forged 30-Feb date $\to$ **Omniscore 12.0 (FRAUD_LOCK)** $\to$ Application locked, critical admin alert fired.
4. **TC-04 (Rhea D'Souza - OCR Discrepancy):** Blurry fee structure JPEG (confidence < 40%) $\to$ Flagged for re-upload $\to$ Pristine PDF uploaded $\to$ ₹3,80,000 approved.

---

## 7. Regulatory Model & Financial Automation
* **LSP / TSP Operating Framework:** Credixa operates as a **Lending Service Provider (LSP)** partnering with regulated Tier-2 NBFCs and banks. Capital disbursements flow directly from partner bank escrow accounts, while Credixa generates revenue from platform fees and origination fees (1.5–3%).
* **Autonomous Scheduling:** Daily 01:00 AM background cron (`loan_scheduler.js`) checks overdue repayments, applies flat ₹500 late fees, and auto-escalates to `DEFAULTED` after 3 missed installments.
