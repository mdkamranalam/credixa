-- TICKET STATUS ENUM
CREATE TYPE ticket_status_enum AS ENUM ('OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED');

-- SUPPORT TICKETS
CREATE TABLE support_tickets (
    ticket_id     UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id       UUID REFERENCES users(user_id) ON DELETE CASCADE,
    institution_id UUID REFERENCES institutions(institution_id) ON DELETE SET NULL,
    subject       VARCHAR(255) NOT NULL,
    category      VARCHAR(50) NOT NULL DEFAULT 'GENERAL',
    status        ticket_status_enum DEFAULT 'OPEN',
    created_at    TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at    TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- SUPPORT MESSAGES (threaded under a ticket)
CREATE TABLE support_messages (
    message_id    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ticket_id     UUID REFERENCES support_tickets(ticket_id) ON DELETE CASCADE,
    sender_id     UUID REFERENCES users(user_id) ON DELETE SET NULL,
    sender_role   VARCHAR(20) NOT NULL,  -- 'STUDENT' | 'INSTITUTION_ADMIN'
    body          TEXT NOT NULL,
    is_read       BOOLEAN DEFAULT FALSE,
    created_at    TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- INDEXES
CREATE INDEX idx_support_tickets_user    ON support_tickets(user_id);
CREATE INDEX idx_support_tickets_inst    ON support_tickets(institution_id);
CREATE INDEX idx_support_messages_ticket ON support_messages(ticket_id);

-- TRIGGER (reuse existing update_modified_column function)
CREATE TRIGGER update_support_tickets_modtime
    BEFORE UPDATE ON support_tickets
    FOR EACH ROW EXECUTE FUNCTION update_modified_column();
