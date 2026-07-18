# Risk Engine Documentation

## Overview
The Risk Engine is a Python-based FastAPI microservice dedicated to autonomous underwriting. It evaluates student and co-applicant financial health by parsing bank statements, running Machine Learning predictions, and leveraging LLMs for nuanced context extraction.

## Core Technologies
- **Framework:** FastAPI (Python 3.11+)
- **Machine Learning:** `xgboost` (classifier), `scikit-learn` (StandardScaler)
- **Document Processing:** `pdfplumber` (native text extraction), `pytesseract` / `pdf2image` (OCR fallback)
- **AI/LLM:** HuggingFace / DeepSeek via API in `llm_extractor.py`
- **Caching:** Redis (asyncio)

## Directory Structure (`risk-engine/`)
- `main.py`: The FastAPI application and core routing.
- `llm_extractor.py`: Interfaces with the language model for JSON extraction.
- `train_model.py` / `evaluate_drift.py`: Utility scripts for managing the XGBoost model.
- `risk_model.pkl` & `scaler.pkl`: The serialized, production-ready machine learning artifacts.

## The Underwriting Pipeline (`/analyze-statement`)

When the API Gateway triggers an evaluation, the Risk Engine executes the following pipeline:

### 1. Document Ingestion & Extraction
- Accepts multi-part form data containing the Student and Parent PDFs.
- Attempts native text extraction via `pdfplumber` asynchronously to avoid blocking the event loop.
- If the document is an image-based PDF or native extraction yields < 50 characters, it falls back to heavy OCR processing via `pytesseract`.

### 2. Immediate Fraud & Tampering Checks
- Runs keyword-based heuristics (`TAMPERED`, `FORGED`, `30-FEB`, etc.) across the extracted text.
- If triggered, immediately aborts the ML phase, assigns an Omniscore of 12.0 (Critical Reject), and locks the application.

### 3. LLM Structured Extraction (with Redis Caching)
- The raw text is passed to an LLM (`llm_extractor.py`) configured to return structured JSON adhering to the `FinancialExtraction` Pydantic schema.
- Extracts `average_balance`, `overdraft_count`, `monthly_income`, and `high_risk_transaction_count`.
- **Optimization:** Text hashes are stored in Redis. Duplicate documents skip the expensive LLM phase.

### 4. Machine Learning Inference
- Combines Student and Parent metrics to calculate household `dti_ratio` (Debt-to-Income) and `savings_rate`.
- Formats the 6 core features: `[avg_balance, overdrafts, gambling_flags, academic_score, dti_ratio, savings_rate]`.
- Scales the array using `scaler.pkl`.
- Predicts via `risk_model.pkl`. 

### 5. Dynamic Explainable AI
- The final score and metrics are passed back to the LLM to generate human-readable reasoning and `pros`/`cons` highlights.
- The payload is returned to the Node.js Gateway.

## Document Validation (`/validate-document`)
A lightweight endpoint used during the student onboarding flow. Instead of full underwriting, it uses the LLM to simply verify if an uploaded document (e.g. "12th Marksheet") actually matches the requested type and belongs to the expected user name.
