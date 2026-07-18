# Frontend UI Documentation

## Overview
The Credixa Frontend is a modern Single Page Application (SPA) providing interfaces for Students, Educational Partners, and Superadmins. It consumes the REST API exposed by the Backend Gateway.

## Core Technologies
- **Framework:** React 19
- **Build Tool:** Vite (for Lightning-fast HMR and optimized bundling)
- **Styling:** Tailwind CSS + PostCSS
- **Routing:** React Router DOM (assumed based on standard SPA architecture)

## Directory Structure (`frontend/`)
- `/public`: Static assets served at the root path.
- `/src`: Core application logic.
  - `App.jsx` / `main.jsx`: Application entrypoints.
  - `/components`: Reusable UI elements (Buttons, Cards, Modals).
  - `/pages`: Top-level route components (Dashboard, Login, Application Wizard).
  - `/services` or `/api`: Axios or Fetch wrappers for communicating with the Backend Gateway.
  - `/utils`: Formatting helpers, auth state management.
- `vite.config.js`: Vite configuration, plugin setup.
- `tailwind.config.js`: Custom theme definitions, color palettes, and plugin configurations.
- `eslint.config.js`: Linter rules ensuring code quality.

## Features & Flows

### 1. Student Onboarding Workflow
A multi-step application process requiring:
- College Verification.
- Semester & Fee Structure Input.
- Co-borrower (Parent) details.
- Document Uploads (Marksheets, Bank Statements) handled via multi-part form requests to the API.

### 2. Partner Institution Portal
A dashboard for educational partners to:
- Monitor incoming student loan requests.
- Verify student academic documents.
- Track disbursement status.

### 3. Superadmin Oversight
Internal tooling to manage the entire platform, review fraud flags, override risk decisions, and monitor API/DB health.

## Environment Configuration
The frontend requires `.env` variables to properly route API requests. 
- `VITE_API_URL`: Points to the Backend Gateway (e.g., `http://localhost:3000` or the live Render URL).

## Development
Run the local Vite development server:
```bash
cd frontend
npm install
npm run dev
```
Access the UI at `http://localhost:5173`.
