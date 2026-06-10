-- V3__create_audit_logs.sql
CREATE TABLE audit_logs (
    id              BIGSERIAL PRIMARY KEY,
    username        VARCHAR(100) NOT NULL,
    action          VARCHAR(100),
    method          VARCHAR(10) NOT NULL,
    request_uri     VARCHAR(255) NOT NULL,
    ip_address      VARCHAR(45),
    status          INT,
    payload         TEXT,
    created_at      TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_username ON audit_logs(username);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);
