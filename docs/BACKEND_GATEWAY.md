# Backend Gateway Documentation

## Overview
The Backend Gateway acts as the central router and business logic processor for the Credixa platform. Built on **Node.js** and **Express**, it handles everything from user authentication to loan management, and securely proxies requests to the AI Risk Engine.

## Directory Structure (`backend-gateway/`)
- `/controllers`: Core business logic linked to routes.
- `/routes`: Express router definitions.
- `/middleware`: Authentication (`auth.middleware.js`), logging, and timing wrappers.
- `/jobs`: Background scheduled jobs (e.g. `loan_scheduler.js`).
- `/services`: Abstractions for external or complex operations (e.g., Email sending, SMS).
- `/utils`: Database connection (`db.js`), observability logic, and cryptographic helpers.
- `server.js`: The main entrypoint, responsible for DB migrations check, CORS config, and route assembly.

## Core API Routes

All authenticated routes require a valid JWT token. Role-based access control (RBAC) is heavily utilized.

### Authentication (`/api/auth`)
- `POST /login`: Authenticates users and sets an HttpOnly cookie containing the JWT.
- `POST /register`: Registers new users/students.
- `POST /logout`: Clears session tokens.

### Loan Management (`/api/loans`)
- Requires `authenticateToken` middleware.
- `POST /apply`: Validates student data and initiates the application.
- `GET /my-loans`: Fetches active/historic loans for a user.
- `GET /:id`: Detailed view of a single loan.

### Institution Controls (`/api/institutions` & `/api/transactions`)
- `GET /`: Lists partner institutions.
- Transactions require `INSTITUTION_ADMIN` role constraints.

### Admin & Superadmin (`/api/admin`, `/api/superadmin`)
- Handles system-wide actions: overriding loan statuses, manual overrides, creating new institutional accounts.

## Middleware

- `authenticateToken`: Verifies the JWT signature from headers or cookies and attaches `req.user`.
- `requireRole("ROLE_NAME")`: Ensures the authenticated user possesses the correct permission role before controller execution.
- `timingMiddleware`: Used in conjunction with `initObservability` to trace API execution latency.

## Database Migrations
On server startup (`server.js`), the gateway connects to PostgreSQL and runs automatic checks against `information_schema.tables` and row counts to ensure `init.sql` and subsequent migrations (`002_support_chat.sql`, `003_superadmin_setup.sql`, `004_seed_partner_institutions.sql`) are applied.
