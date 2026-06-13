-- Migration: V5__add_check_count_to_attendance_logs.sql
-- Description: Add check_count column to attendance_logs table
-- Timestamp: 2026-06-13

ALTER TABLE attendance_logs ADD COLUMN check_count INT DEFAULT 0;

-- Update existing records: count is 2 if both check_in and check_out are not null, 1 if only one is not null, otherwise 0
UPDATE attendance_logs
SET check_count = CASE
    WHEN check_in IS NOT NULL AND check_out IS NOT NULL THEN 2
    WHEN check_in IS NOT NULL OR check_out IS NOT NULL THEN 1
    ELSE 0
END;
