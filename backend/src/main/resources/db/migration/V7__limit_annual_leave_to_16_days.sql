-- V7: Giới hạn số ngày phép năm tối đa 16 ngày cho mỗi nhân sự
-- Cập nhật tất cả các bản ghi leave_balances liên quan đến loại phép ANNUAL
-- có total_days vượt quá 16 ngày về mức 16 ngày

-- Cập nhật các bản ghi leave_balances có total_days > 16 về 16 ngày
-- Chỉ áp dụng cho loại phép ANNUAL
UPDATE leave_balances lb
SET total_days = 16.0
WHERE lb.leave_type_id IN (
    SELECT id FROM leave_types WHERE code = 'ANNUAL'
)
AND lb.total_days > 16.0;

-- Log kết quả
-- PostgreSQL sẽ trả về số dòng bị ảnh hưởng sau khi chạy UPDATE
