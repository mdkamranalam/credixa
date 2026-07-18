# Database Schema Documentation

Credixa relies on PostgreSQL 16 for a robust, highly-relational data structure. It enforces strict referential integrity between Institutions, Users, Loans, and schedules.

## 1. Core Independent Tables

### 1.1 `institutions`
Stores partner educational institutions capable of accepting BNPL loan disbursements.
- **Key Fields**: `institution_id` (UUID), `code` (Unique), `bank_account_number`, `ifsc_code`.

### 1.2 `users`
The primary authentication and profile store for students and admins.
- **Key Fields**: `user_id` (UUID), `institution_id` (FK), `role` (Admin/Student/Superadmin), `pan_number` (Unique), `aadhaar_hash`.
- **Note**: Aadhaar details are hashed for deduplication and encrypted for storage.

## 2. Relational & Dependent Tables

### 2.1 `loans`
The centerpiece of the application. Tracks student loan requests and current status.
- **Key Fields**: `loan_id` (UUID), `user_id` (FK), `institution_id` (FK), `requested_amount`, `approved_amount`.
- **Status Enum**: `APPLIED`, `UNDER_REVIEW`, `APPROVED`, `ACTIVE`, `REJECTED`, `CLOSED`, `DEFAULTED`.

### 2.2 `co_applicants`
Linked to a user initially during onboarding, and permanently linked to a `loan_id` upon application submission.
- **Key Fields**: `user_id` (FK), `loan_id` (Nullable FK), `relationship`, `aadhaar_number`, `monthly_income`.

### 2.3 `repayment_schedules`
Calculated amortizations generated upon loan approval.
- **Key Fields**: `loan_id` (FK), `due_date`, `emi_amount`.
- **Status Enum**: `PENDING`, `PAID`, `OVERDUE`, `WAIVED`.
- **Constraint**: Unique combination of `loan_id` and `due_date` prevents duplicate generation.

### 2.4 `transactions`
Immutable ledger of financial movements (disbursements and EMI repayments).
- **Key Fields**: `txn_id`, `loan_id` (FK), `amount`, `txn_type`.
- **Types**: `DISBURSAL`, `REPAYMENT`, `LATE_FEE`, `REFUND`.

### 2.5 `risk_scores`
Stores historical snapshots of the Risk Engine's evaluations.
- **Key Fields**: `loan_id` (FK), `omniscore` (0-900), `risk_tier`, `risk_flags` (JSONB).

### 2.6 `loan_documents`
Tracks all uploaded PDFs/images alongside their OCR validation state.
- **Key Fields**: `loan_id` (FK), `user_id` (FK), `category` (Bank Statement, Marksheet, etc.), `extracted_text`, `is_verified`.

## 3. Auditing
### `audit_logs`
Every state change to a loan or critical system setting is appended here.
- **Key Fields**: `loan_id`, `actor_user_id`, `old_status`, `new_status`, `notes`.

## 4. Migrations
Stored in `database/migrations/`.
- `002_support_chat.sql`: Adds support ticketing tables.
- `003_superadmin_setup.sql`: Creates system settings.
- `004_seed_partner_institutions.sql`: Pre-seeds testing/production partner colleges.
