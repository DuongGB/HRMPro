-- =============================================
-- HRMPro — Add Reset Token Columns to Users (v9.0)
-- =============================================

ALTER TABLE users ADD COLUMN reset_token VARCHAR(100);
ALTER TABLE users ADD COLUMN reset_token_expiry TIMESTAMP;
