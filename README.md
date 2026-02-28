# Credixa BNPL Platform

Credixa is a comprehensive Buy Now Pay Later (BNPL) platform specifically designed for students, featuring an AI-driven risk engine to assess creditworthiness based on bank statement analysis.

## 🏗️ Architecture Overview

The platform uses a modern microservices architecture powered by Docker:

### 1. Frontend (`/frontend`)
- **Tech Stack:** React 19, Vite, TailwindCSS, React Router
- **Overview:** Provides distinct interfaces for Students (to apply for loans, upload documents, and track progress) and Institution Admins (to review applications and monitor metrics).

### 2. Backend Gateway (`/backend-gateway`)
- **Tech Stack:** Node.js, Express, PostgreSQL, JWT, Multer
- **Overview:** The central API gateway handles user authentication, loan application routing, document uploads, repayment scheduling, and acts as the orchestrator between the frontend and the AI risk engine.

### 3. AI Risk Engine (`/risk-engine`)
- **Tech Stack:** Python, FastAPI, scikit-learn, pdfplumber
- **Overview:** A dedicated machine learning service that ingests student and parent bank statements (PDFs), extracts behavioral financial features (average balance, overdrafts, risk keywords), and runs a Random Forest model to generate an `omniscore` (CIBIL equivalent) and a deterministic approval decision.

### 4. Database (`/database`)
- **Tech Stack:** PostgreSQL 16
- **Overview:** Relational database storing user profiles, loan applications, documents metadata, repayment schedules, and transaction history.

---

## 🚀 Getting Started

The entire application stack (frontend, backend, AI risk engine, and databases) can be launched seamlessly using Docker Compose.

### Running the Services

**1. Start all services:**
```bash
docker-compose up --build
```
This will spin up:
- PostgreSQL database (`credixa-postgres` on port `5432`)
- Redis cache (`credixa-redis` on port `6379`)
- Node.js Gateway (`backend` on port `3000`)
- Python Risk Engine (`risk-engine` on port `8000`)
- React Frontend (`frontend` on port `5173`)

**2. Access the Application:**
The frontend will be accessible at `http://localhost:5173`.

### Database Management Commands

**Verify the tables exist:**
```bash
docker exec -it credixa-postgres psql -U credixa_admin -d credixa_db -c "\dt"
```

**Access the PostgreSQL shell:**
```bash
docker exec -it credixa-postgres psql -U credixa_admin -d credixa_db
```

**Shut down services and remove volumes (reset database):**
```bash
docker-compose down -v
```

---

## 🔒 Key Features

- **Document Vault:** Secure upload and storage of academic and financial documents.
- **AI-Powered Underwriting:** Automated loan decisioning using predictive ML models evaluating non-traditional financial indicators.
- **Dynamic Dashboards:** Real-time application tracking and repayment schedules.
- **Role-Based Access:** Dedicated portals and functionality for students and administrators.