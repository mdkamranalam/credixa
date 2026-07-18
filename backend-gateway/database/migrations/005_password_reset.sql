-- RESET REQUEST STATUS ENUM
CREATE TYPE reset_request_status_enum AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'COMPLETED');

-- PASSWORD RESET REQUESTS
CREATE TABLE password_reset_requests (
    request_id    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id       UUID REFERENCES users(user_id) ON DELETE CASCADE,
    status        reset_request_status_enum DEFAULT 'PENDING',
    created_at    TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at    TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- INDEXES
CREATE INDEX idx_password_reset_requests_user ON password_reset_requests(user_id);
CREATE INDEX idx_password_reset_requests_status ON password_reset_requests(status);

-- TRIGGER (reuse existing update_modified_column function)
CREATE TRIGGER update_password_reset_requests_modtime
    BEFORE UPDATE ON password_reset_requests
    FOR EACH ROW EXECUTE FUNCTION update_modified_column();
