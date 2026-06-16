-- HRMPro Migration: V8__fix_interview_sample_data_interviewers.sql
-- Description: Fix invalid interviewers string data in interviews table seeded by V4 migration
-- Timestamp: 2026-06-16
-- =============================================================================

-- 1. Cho Phạm Quốc Đạt (vòng 1) - Cập nhật lại ID thực tế của EMP-REC
UPDATE interviews 
SET interviewers = (SELECT CAST(id AS VARCHAR) FROM employees WHERE employee_code = 'EMP-REC')
WHERE application_id = (SELECT id FROM applications WHERE candidate_name = 'Phạm Quốc Đạt')
  AND round = 1;

-- 2. Cho Phạm Quốc Đạt (vòng 2) - Ghép ID của EMP-MGR và EMP-EMP phân tách bởi dấu phẩy
UPDATE interviews 
SET interviewers = CONCAT(
    (SELECT id FROM employees WHERE employee_code = 'EMP-MGR'),
    ',',
    (SELECT id FROM employees WHERE employee_code = 'EMP-EMP')
)
WHERE application_id = (SELECT id FROM applications WHERE candidate_name = 'Phạm Quốc Đạt')
  AND round = 2;

-- 3. Cho Nguyễn Thị Mai (vòng 1) - Ghép ID của EMP-REC và EMP-HRADM phân tách bởi dấu phẩy
UPDATE interviews 
SET interviewers = CONCAT(
    (SELECT id FROM employees WHERE employee_code = 'EMP-REC'),
    ',',
    (SELECT id FROM employees WHERE employee_code = 'EMP-HRADM')
)
WHERE application_id = (SELECT id FROM applications WHERE candidate_name = 'Nguyễn Thị Mai')
  AND round = 1;
