# Credixa System Architecture

## 1. High-Level Ecosystem Overview

Credixa operates on a heavily distributed, 5-pillar microservices architecture optimized for rapid financial underwriting and secure data handling.

| Service Pillar | Technology Stack | Core Responsibilities |
| :--- | :--- | :--- |
| **Frontend UI** | React 19, Vite, Tailwind CSS | Serves the student/admin portals, dynamic loan applications. |
| **API Gateway** | Node.js, Express | Central router, JWT Auth, Business logic, Postgres Interface. |
| **Risk Engine** | Python, FastAPI | XGBoost prediction, PDF text extraction, OCR, LLM inference. |
| **Database** | PostgreSQL 16 | Relational data persistence, audit logging, complex transactions. |
| **Cache Layer** | Redis 7 | State caching, LLM response caching, rate limiting. |

## 2. Component Diagram

```mermaid
graph TD
    Client["🖥️ Student / Admin Portal (React)"] -->|HTTPS / REST| Gateway["⚡ API Gateway (Node.js/Express)"]
    Gateway <-->|SQL Queries (pgbouncer)| DB[("🗄️ PostgreSQL Database")]
    Gateway <-->|Cache / Session| Redis[("🔥 Redis Cache")]
    Gateway <-->|POST /analyze-statement (x-api-key)| AI["🧠 AI Risk Engine (FastAPI)"]
    
    subgraph AI Service
        AI -->|PDF Parsing| PDF["📄 pdfplumber / OCR"]
        AI -->|Feature Extraction| LLM["🤖 LLM Feature Engine"]
        AI -->|Standardization| Scaler["📈 scikit-learn Scaler"]
        Scaler -->|Inference| ML["📊 XGBoost Classifier"]
    end
```

## 3. Inter-Service Communication & Security

### 3.1 Gateway ➔ Risk Engine
- **Protocol:** HTTP POST REST calls.
- **Authentication:** Enforced via `x-api-key` header matching the `RISK_ENGINE_API_KEY` environment variable.
- **Payload:** Multi-part form data containing PDF documents.

### 3.2 Gateway ➔ Database
- **Protocol:** TCP / PostgreSQL Protocol (Port 5432 / 6432).
- **Pooling:** Connection pooling is managed by PgBouncer (Port 6432 in Docker).
- **Schema Management:** Automated on-startup migrations via `server.js` startup checks.

### 3.3 Gateway ➔ Frontend
- **Protocol:** HTTPS / REST endpoints.
- **Authentication:** Standard JWT (JSON Web Tokens) stored securely in HttpOnly cookies or Authorization headers.
- **CORS:** Dynamic whitelisting via environment variables (`FRONTEND_URL`).

## 4. Deployment Architecture
Credixa uses Infrastructure-as-Code principles:
- **Local:** `docker-compose.yml` orchestrates all 5 services locally.
- **Production (Render):** Managed via `render.yaml` Blueprints which natively spins up isolated Web Services, Private Services, PostgreSQL instances, and Redis instances.
