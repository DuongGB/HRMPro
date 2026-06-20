-- e:/HRMPro/backend/src/main/resources/db/migration/V6__add_approval_columns_to_interviews.sql
-- Migration file to add approval columns to interviews table

ALTER TABLE interviews ADD COLUMN approval_status VARCHAR(20) DEFAULT 'PENDING';
ALTER TABLE interviews ADD COLUMN approval_feedback TEXT;
ALTER TABLE interviews ADD COLUMN approved_at TIMESTAMP;
