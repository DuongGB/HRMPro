-- =============================================================================
-- HRMPro Migration: V4__insert_real_sample_data.sql
-- Description: Seed realistic, relational sample data for all tables
-- Timestamp: 2026-06-10
-- =============================================================================

-- ─── 1. UPDATE EXISTING POSITIONS & INSERT NEW POSITIONS ─────────────────────
-- Cập nhật department_id cho các position được tạo từ V1
UPDATE positions SET department_id = (SELECT id FROM departments WHERE code = 'DEP-EXEC') WHERE code = 'POS-CEO';
UPDATE positions SET department_id = (SELECT id FROM departments WHERE code = 'DEP-HR') WHERE code = 'POS-HR-MGR';
UPDATE positions SET department_id = (SELECT id FROM departments WHERE code = 'DEP-TECH') WHERE code IN ('POS-DEV-SR', 'POS-DEV-MD', 'POS-DEV-JR');

-- Thêm các position mới cho các phòng ban khác
INSERT INTO positions (code, name, department_id, level, description) VALUES
('POS-HR-STF', 'Chuyên viên Nhân sự', (SELECT id FROM departments WHERE code = 'DEP-HR'), 'MIDDLE', 'Chịu trách nhiệm về các hoạt động nhân sự hàng ngày'),
('POS-HR-REC', 'Chuyên viên Tuyển dụng', (SELECT id FROM departments WHERE code = 'DEP-HR'), 'MIDDLE', 'Chịu trách nhiệm tuyển dụng và thu hút tài năng'),
('POS-TECH-MGR', 'Trưởng phòng Công nghệ', (SELECT id FROM departments WHERE code = 'DEP-TECH'), 'MANAGER', 'Quản lý đội ngũ phát triển phần mềm và hạ tầng công nghệ'),
('POS-FIN-MGR', 'Trưởng phòng Tài chính', (SELECT id FROM departments WHERE code = 'DEP-FIN'), 'MANAGER', 'Quản lý tài chính, kế hoạch ngân sách và kế toán'),
('POS-FIN-ACC', 'Kế toán tổng hợp', (SELECT id FROM departments WHERE code = 'DEP-FIN'), 'MIDDLE', 'Thực hiện các nghiệp vụ kế toán và báo cáo thuế'),
('POS-MKT-MGR', 'Trưởng phòng Marketing', (SELECT id FROM departments WHERE code = 'DEP-MKT'), 'MANAGER', 'Xây dựng kế hoạch và quản lý các hoạt động marketing'),
('POS-MKT-EXEC', 'Chuyên viên Marketing', (SELECT id FROM departments WHERE code = 'DEP-MKT'), 'MIDDLE', 'Thực thi các chiến dịch truyền thông và marketing số'),
('POS-SALE-MGR', 'Trưởng phòng Kinh doanh', (SELECT id FROM departments WHERE code = 'DEP-SALE'), 'MANAGER', 'Xây dựng và dẫn dắt đội ngũ thực hiện mục tiêu doanh số'),
('POS-SALE-EXEC', 'Chuyên viên Kinh doanh', (SELECT id FROM departments WHERE code = 'DEP-SALE'), 'MIDDLE', 'Tìm kiếm khách hàng và chăm sóc các mối quan hệ kinh doanh');


-- ─── 2. UPDATE REALISTIC DATA FOR 6 TEST EMPLOYEES (V2) ─────────────────────
UPDATE employees SET 
    first_name = 'Hoàng', 
    last_name = 'Lê Anh', 
    personal_email = 'hoangle.exec@gmail.com', 
    phone = '0901234567', 
    date_of_birth = '1985-05-15', 
    gender = 'MALE', 
    id_card_number = '001085000123', 
    id_card_issued_date = '2021-03-10', 
    id_card_issued_place = 'Cục Cảnh sát QLHC về trật tự xã hội', 
    permanent_address = '12 Tràng Tiền, Hoàn Kiếm, Hà Nội', 
    current_address = '12 Tràng Tiền, Hoàn Kiếm, Hà Nội', 
    department_id = (SELECT id FROM departments WHERE code = 'DEP-EXEC'), 
    position_id = (SELECT id FROM positions WHERE code = 'POS-CEO'), 
    tax_code = '8012345678', 
    bank_account_number = '19031234567890', 
    bank_name = 'Techcombank', 
    social_insurance_id = '0115123456',
    created_by = 'migration_system'
WHERE employee_code = 'EMP-SUPER';

UPDATE employees SET 
    first_name = 'Hà', 
    last_name = 'Nguyễn Thanh', 
    personal_email = 'thanhha.hr@gmail.com', 
    phone = '0902345678', 
    date_of_birth = '1988-10-20', 
    gender = 'FEMALE', 
    id_card_number = '002088000456', 
    id_card_issued_date = '2021-05-12', 
    id_card_issued_place = 'Cục Cảnh sát QLHC về trật tự xã hội', 
    permanent_address = '45 Lê Lợi, Quận 1, TP. Hồ Chí Minh', 
    current_address = '45 Lê Lợi, Quận 1, TP. Hồ Chí Minh', 
    department_id = (SELECT id FROM departments WHERE code = 'DEP-HR'), 
    position_id = (SELECT id FROM positions WHERE code = 'POS-HR-MGR'), 
    tax_code = '8023456789', 
    bank_account_number = '0071000123456', 
    bank_name = 'Vietcombank', 
    social_insurance_id = '0118234567',
    created_by = 'migration_system'
WHERE employee_code = 'EMP-HRADM';

UPDATE employees SET 
    first_name = 'Ly', 
    last_name = 'Trần Hương', 
    personal_email = 'huongly.hr@gmail.com', 
    phone = '0903456789', 
    date_of_birth = '1995-02-14', 
    gender = 'FEMALE', 
    id_card_number = '003095000789', 
    id_card_issued_date = '2021-08-15', 
    id_card_issued_place = 'Cục Cảnh sát QLHC về trật tự xã hội', 
    permanent_address = '89 Nguyễn Trãi, Thanh Xuân, Hà Nội', 
    current_address = '89 Nguyễn Trãi, Thanh Xuân, Hà Nội', 
    department_id = (SELECT id FROM departments WHERE code = 'DEP-HR'), 
    position_id = (SELECT id FROM positions WHERE code = 'POS-HR-STF'), 
    tax_code = '8034567890', 
    bank_account_number = '1012345678', 
    bank_name = 'VietinBank', 
    social_insurance_id = '0125345678',
    created_by = 'migration_system'
WHERE employee_code = 'EMP-HRSTF';

UPDATE employees SET 
    first_name = 'Tuấn', 
    last_name = 'Phạm Anh', 
    personal_email = 'anhtuan.tech@gmail.com', 
    phone = '0904567890', 
    date_of_birth = '1990-09-09', 
    gender = 'MALE', 
    id_card_number = '004090000123', 
    id_card_issued_date = '2021-09-09', 
    id_card_issued_place = 'Cục Cảnh sát QLHC về trật tự xã hội', 
    permanent_address = '101 Cầu Giấy, Cầu Giấy, Hà Nội', 
    current_address = '101 Cầu Giấy, Cầu Giấy, Hà Nội', 
    department_id = (SELECT id FROM departments WHERE code = 'DEP-TECH'), 
    position_id = (SELECT id FROM positions WHERE code = 'POS-TECH-MGR'), 
    tax_code = '8045678901', 
    bank_account_number = '0451000123456', 
    bank_name = 'Vietcombank', 
    social_insurance_id = '0120456789',
    created_by = 'migration_system'
WHERE employee_code = 'EMP-MGR';

UPDATE employees SET 
    first_name = 'Nam', 
    last_name = 'Nguyễn Đức', 
    personal_email = 'ducnam.dev@gmail.com', 
    phone = '0905678901', 
    date_of_birth = '1998-12-25', 
    gender = 'MALE', 
    id_card_number = '005098000456', 
    id_card_issued_date = '2022-01-10', 
    id_card_issued_place = 'Cục Cảnh sát QLHC về trật tự xã hội', 
    permanent_address = '202 Trần Hưng Đạo, Quận 5, TP. Hồ Chí Minh', 
    current_address = '202 Trần Hưng Đạo, Quận 5, TP. Hồ Chí Minh', 
    department_id = (SELECT id FROM departments WHERE code = 'DEP-TECH'), 
    position_id = (SELECT id FROM positions WHERE code = 'POS-DEV-SR'), 
    tax_code = '8056789012', 
    bank_account_number = '19035678901234', 
    bank_name = 'Techcombank', 
    social_insurance_id = '0128567890',
    created_by = 'migration_system'
WHERE employee_code = 'EMP-EMP';

UPDATE employees SET 
    first_name = 'Thảo', 
    last_name = 'Vũ Phương', 
    personal_email = 'phuongthao.rec@gmail.com', 
    phone = '0906789012', 
    date_of_birth = '1993-07-30', 
    gender = 'FEMALE', 
    id_card_number = '006093000789', 
    id_card_issued_date = '2021-12-15', 
    id_card_issued_place = 'Cục Cảnh sát QLHC về trật tự xã hội', 
    permanent_address = '55 Kim Mã, Ba Đình, Hà Nội', 
    current_address = '55 Kim Mã, Ba Đình, Hà Nội', 
    department_id = (SELECT id FROM departments WHERE code = 'DEP-HR'), 
    position_id = (SELECT id FROM positions WHERE code = 'POS-HR-REC'), 
    tax_code = '8067890123', 
    bank_account_number = '2201234567', 
    bank_name = 'BIDV', 
    social_insurance_id = '0123678901',
    created_by = 'migration_system'
WHERE employee_code = 'EMP-REC';


-- ─── 3. INSERT 8 NEW REALISTIC EMPLOYEES ──────────────────────────────────────
INSERT INTO employees (employee_code, first_name, last_name, email, personal_email, phone, date_of_birth, gender, id_card_number, id_card_issued_date, id_card_issued_place, permanent_address, current_address, hire_date, status, department_id, position_id, tax_code, bank_account_number, bank_name, social_insurance_id, created_by) VALUES
('EMP-0001', 'Linh', 'Phan Khánh', 'khanhlinh.fin@hrmpro.com', 'linhphan.fin@gmail.com', '0912111222', '1987-03-24', 'FEMALE', '001087000111', '2021-04-10', 'Cục Cảnh sát QLHC về trật tự xã hội', '15 Thụy Khuê, Tây Hồ, Hà Nội', '15 Thụy Khuê, Tây Hồ, Hà Nội', '2025-03-01', 'ACTIVE', (SELECT id FROM departments WHERE code = 'DEP-FIN'), (SELECT id FROM positions WHERE code = 'POS-FIN-MGR'), '8071234561', '19030011223344', 'Techcombank', '0120111222', 'migration_system'),
('EMP-0002', 'Bình', 'Nguyễn Thái', 'thaibinh.acc@hrmpro.com', 'binhnguyen.acc@gmail.com', '0912333444', '1996-08-11', 'MALE', '002096000222', '2022-05-15', 'Cục Cảnh sát QLHC về trật tự xã hội', '124 Đội Cấn, Ba Đình, Hà Nội', '124 Đội Cấn, Ba Đình, Hà Nội', '2025-09-01', 'ACTIVE', (SELECT id FROM departments WHERE code = 'DEP-FIN'), (SELECT id FROM positions WHERE code = 'POS-FIN-ACC'), '8071234562', '1022334455', 'VietinBank', '0120333444', 'migration_system'),
('EMP-0003', 'Sơn', 'Đặng Hồng', 'hongson.mkt@hrmpro.com', 'sondang.mkt@gmail.com', '0912555666', '1989-11-02', 'MALE', '003089000333', '2021-06-18', 'Cục Cảnh sát QLHC về trật tự xã hội', '78 Láng Hạ, Đống Đa, Hà Nội', '78 Láng Hạ, Đống Đa, Hà Nội', '2025-02-01', 'ACTIVE', (SELECT id FROM departments WHERE code = 'DEP-MKT'), (SELECT id FROM positions WHERE code = 'POS-MKT-MGR'), '8071234563', '0071000998877', 'Vietcombank', '0120555666', 'migration_system'),
('EMP-0004', 'Dương', 'Phạm Thùy', 'thuyduong.mkt@hrmpro.com', 'duongpham.mkt@gmail.com', '0912777888', '1998-05-30', 'FEMALE', '004098000444', '2023-01-20', 'Cục Cảnh sát QLHC về trật tự xã hội', '19 Chùa Bộc, Đống Đa, Hà Nội', '19 Chùa Bộc, Đống Đa, Hà Nội', '2025-11-01', 'ACTIVE', (SELECT id FROM departments WHERE code = 'DEP-MKT'), (SELECT id FROM positions WHERE code = 'POS-MKT-EXEC'), '8071234564', '1033445566', 'BIDV', '0120777888', 'migration_system'),
('EMP-0005', 'Quang', 'Ngô Minh', 'minhquang.sale@hrmpro.com', 'quangngo.sale@gmail.com', '0912999000', '1991-04-12', 'MALE', '005091000555', '2021-10-22', 'Cục Cảnh sát QLHC về trật tự xã hội', '302 Minh Khai, Hai Bà Trưng, Hà Nội', '302 Minh Khai, Hai Bà Trưng, Hà Nội', '2025-01-01', 'ACTIVE', (SELECT id FROM departments WHERE code = 'DEP-SALE'), (SELECT id FROM positions WHERE code = 'POS-SALE-MGR'), '8071234565', '2201999888', 'BIDV', '0120999000', 'migration_system'),
('EMP-0006', 'Hương', 'Đỗ Mai', 'maihuong.sale@hrmpro.com', 'huongdo.sale@gmail.com', '0913111222', '1997-12-05', 'FEMALE', '006097000666', '2022-09-10', 'Cục Cảnh sát QLHC về trật tự xã hội', '458 Minh Khai, Hai Bà Trưng, Hà Nội', '458 Minh Khai, Hai Bà Trưng, Hà Nội', '2025-10-01', 'ACTIVE', (SELECT id FROM departments WHERE code = 'DEP-SALE'), (SELECT id FROM positions WHERE code = 'POS-SALE-EXEC'), '8071234566', '19039988776655', 'Techcombank', '0121111222', 'migration_system'),
('EMP-0007', 'Hải', 'Trịnh Thế', 'thehai.dev@hrmpro.com', 'haitrinh.dev@gmail.com', '0913333444', '1993-01-18', 'MALE', '007093000777', '2021-08-11', 'Cục Cảnh sát QLHC về trật tự xã hội', '15 Duy Tân, Cầu Giấy, Hà Nội', '15 Duy Tân, Cầu Giấy, Hà Nội', '2025-07-01', 'ACTIVE', (SELECT id FROM departments WHERE code = 'DEP-TECH'), (SELECT id FROM positions WHERE code = 'POS-DEV-MD'), '8071234567', '0451000665544', 'Vietcombank', '0121333444', 'migration_system'),
('EMP-0008', 'Dũng', 'Hoàng Trung', 'trungdung.dev@hrmpro.com', 'dunghoang.dev@gmail.com', '0913555666', '2001-09-22', 'MALE', '008001000888', '2023-10-05', 'Cục Cảnh sát QLHC về trật tự xã hội', '88 Võ Chí Công, Tây Hồ, Hà Nội', '88 Võ Chí Công, Tây Hồ, Hà Nội', '2026-05-01', 'PROBATION', (SELECT id FROM departments WHERE code = 'DEP-TECH'), (SELECT id FROM positions WHERE code = 'POS-DEV-JR'), '8071234568', '1099887766', 'VietinBank', '0121555666', 'migration_system');


-- ─── 4. INSERT USERS & ROLES FOR NEW EMPLOYEES ──────────────────────────────
-- Mật khẩu mặc định: '123456' tương ứng với BCrypt hash trong V2
INSERT INTO users (username, password, employee_id, is_active) VALUES
('finance_mgr', '$2a$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGG.X.gC', (SELECT id FROM employees WHERE employee_code = 'EMP-0001'), true),
('accountant', '$2a$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGG.X.gC', (SELECT id FROM employees WHERE employee_code = 'EMP-0002'), true),
('marketing_mgr', '$2a$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGG.X.gC', (SELECT id FROM employees WHERE employee_code = 'EMP-0003'), true),
('marketing_exec', '$2a$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGG.X.gC', (SELECT id FROM employees WHERE employee_code = 'EMP-0004'), true),
('sales_mgr', '$2a$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGG.X.gC', (SELECT id FROM employees WHERE employee_code = 'EMP-0005'), true),
('sales_exec', '$2a$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGG.X.gC', (SELECT id FROM employees WHERE employee_code = 'EMP-0006'), true),
('dev_mid', '$2a$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGG.X.gC', (SELECT id FROM employees WHERE employee_code = 'EMP-0007'), true),
('dev_jr', '$2a$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGG.X.gC', (SELECT id FROM employees WHERE employee_code = 'EMP-0008'), true);

-- Gán quyền cho các tài khoản mới
INSERT INTO user_roles (user_id, role_id) VALUES
((SELECT id FROM users WHERE username = 'finance_mgr'), (SELECT id FROM roles WHERE name = 'MANAGER')),
((SELECT id FROM users WHERE username = 'accountant'), (SELECT id FROM roles WHERE name = 'EMPLOYEE')),
((SELECT id FROM users WHERE username = 'marketing_mgr'), (SELECT id FROM roles WHERE name = 'MANAGER')),
((SELECT id FROM users WHERE username = 'marketing_exec'), (SELECT id FROM roles WHERE name = 'EMPLOYEE')),
((SELECT id FROM users WHERE username = 'sales_mgr'), (SELECT id FROM roles WHERE name = 'MANAGER')),
((SELECT id FROM users WHERE username = 'sales_exec'), (SELECT id FROM roles WHERE name = 'EMPLOYEE')),
((SELECT id FROM users WHERE username = 'dev_mid'), (SELECT id FROM roles WHERE name = 'EMPLOYEE')),
((SELECT id FROM users WHERE username = 'dev_jr'), (SELECT id FROM roles WHERE name = 'EMPLOYEE'));


-- ─── 5. UPDATE DEPARTMENTS MANAGERS & EMPLOYEES MANAGERS ────────────────────
-- Cập nhật manager cho các phòng ban (departments)
UPDATE departments SET manager_id = (SELECT id FROM employees WHERE employee_code = 'EMP-SUPER') WHERE code = 'DEP-EXEC';
UPDATE departments SET manager_id = (SELECT id FROM employees WHERE employee_code = 'EMP-HRADM') WHERE code = 'DEP-HR';
UPDATE departments SET manager_id = (SELECT id FROM employees WHERE employee_code = 'EMP-MGR') WHERE code = 'DEP-TECH';
UPDATE departments SET manager_id = (SELECT id FROM employees WHERE employee_code = 'EMP-0001') WHERE code = 'DEP-FIN';
UPDATE departments SET manager_id = (SELECT id FROM employees WHERE employee_code = 'EMP-0003') WHERE code = 'DEP-MKT';
UPDATE departments SET manager_id = (SELECT id FROM employees WHERE employee_code = 'EMP-0005') WHERE code = 'DEP-SALE';

-- Cập nhật manager_id cho các nhân viên
-- 1. CEO không có quản lý trực tiếp (đã NULL)
-- 2. Các Trưởng phòng báo cáo trực tiếp cho CEO
UPDATE employees SET manager_id = (SELECT id FROM employees WHERE employee_code = 'EMP-SUPER')
WHERE employee_code IN ('EMP-HRADM', 'EMP-MGR', 'EMP-0001', 'EMP-0003', 'EMP-0005');

-- 3. Nhân viên phòng Nhân sự báo cáo cho Trưởng phòng Nhân sự
UPDATE employees SET manager_id = (SELECT id FROM employees WHERE employee_code = 'EMP-HRADM')
WHERE employee_code IN ('EMP-HRSTF', 'EMP-REC');

-- 4. Nhân viên phòng Công nghệ báo cáo cho Trưởng phòng Công nghệ
UPDATE employees SET manager_id = (SELECT id FROM employees WHERE employee_code = 'EMP-MGR')
WHERE employee_code IN ('EMP-EMP', 'EMP-0007', 'EMP-0008');

-- 5. Nhân viên phòng Tài chính báo cáo cho Trưởng phòng Tài chính
UPDATE employees SET manager_id = (SELECT id FROM employees WHERE employee_code = 'EMP-0001')
WHERE employee_code = 'EMP-0002';

-- 6. Nhân viên phòng Marketing báo cáo cho Trưởng phòng Marketing
UPDATE employees SET manager_id = (SELECT id FROM employees WHERE employee_code = 'EMP-0003')
WHERE employee_code = 'EMP-0004';

-- 7. Nhân viên phòng Kinh doanh báo cáo cho Trưởng phòng Kinh doanh
UPDATE employees SET manager_id = (SELECT id FROM employees WHERE employee_code = 'EMP-0005')
WHERE employee_code = 'EMP-0006';


-- ─── 6. INSERT CONTRACTS FOR ALL EMPLOYEES ──────────────────────────────────
INSERT INTO contracts (employee_id, contract_number, contract_type, start_date, end_date, base_salary, status, signed_at, notes) VALUES
((SELECT id FROM employees WHERE employee_code = 'EMP-SUPER'), 'HDLD/2024/0001', 'INDEFINITE', '2024-01-01', NULL, 85000000.00, 'ACTIVE', '2024-01-01', 'Hợp đồng Giám đốc điều hành'),
((SELECT id FROM employees WHERE employee_code = 'EMP-HRADM'), 'HDLD/2024/0002', 'INDEFINITE', '2024-01-01', NULL, 35000000.00, 'ACTIVE', '2024-01-01', 'Hợp đồng Trưởng phòng Nhân sự'),
((SELECT id FROM employees WHERE employee_code = 'EMP-HRSTF'), 'HDLD/2024/0003', 'FIXED_TERM_3Y', '2024-06-01', '2027-05-31', 18000000.00, 'ACTIVE', '2024-05-28', 'Hợp đồng lao động Chuyên viên Nhân sự'),
((SELECT id FROM employees WHERE employee_code = 'EMP-MGR'), 'HDLD/2024/0004', 'INDEFINITE', '2024-01-01', NULL, 50000000.00, 'ACTIVE', '2024-01-01', 'Hợp đồng Trưởng phòng Công nghệ'),
((SELECT id FROM employees WHERE employee_code = 'EMP-EMP'), 'HDLD/2024/0005', 'FIXED_TERM_3Y', '2024-01-01', '2026-12-31', 28000000.00, 'ACTIVE', '2023-12-28', 'Hợp đồng lao động Senior Developer'),
((SELECT id FROM employees WHERE employee_code = 'EMP-REC'), 'HDLD/2025/0001', 'FIXED_TERM_1Y', '2025-01-01', '2026-12-31', 16000000.00, 'ACTIVE', '2024-12-25', 'Hợp đồng lao động Chuyên viên Tuyển dụng'),
((SELECT id FROM employees WHERE employee_code = 'EMP-0001'), 'HDLD/2025/0002', 'FIXED_TERM_3Y', '2025-03-01', '2028-02-28', 40000000.00, 'ACTIVE', '2025-02-25', 'Hợp đồng Trưởng phòng Tài chính'),
((SELECT id FROM employees WHERE employee_code = 'EMP-0002'), 'HDLD/2025/0003', 'FIXED_TERM_1Y', '2025-09-01', '2026-08-31', 14000000.00, 'ACTIVE', '2025-08-25', 'Hợp đồng lao động Kế toán viên'),
((SELECT id FROM employees WHERE employee_code = 'EMP-0003'), 'HDLD/2025/0004', 'FIXED_TERM_3Y', '2025-02-01', '2028-01-31', 38000000.00, 'ACTIVE', '2025-01-26', 'Hợp đồng Trưởng phòng Marketing'),
((SELECT id FROM employees WHERE employee_code = 'EMP-0004'), 'HDLD/2025/0005', 'FIXED_TERM_1Y', '2025-11-01', '2026-10-31', 15000000.00, 'ACTIVE', '2025-10-27', 'Hợp đồng lao động Chuyên viên Marketing'),
((SELECT id FROM employees WHERE employee_code = 'EMP-0005'), 'HDLD/2025/0006', 'FIXED_TERM_3Y', '2025-01-01', '2027-12-31', 42000000.00, 'ACTIVE', '2024-12-28', 'Hợp đồng Trưởng phòng Kinh doanh'),
((SELECT id FROM employees WHERE employee_code = 'EMP-0006'), 'HDLD/2025/0007', 'FIXED_TERM_1Y', '2025-10-01', '2026-09-30', 13000000.00, 'ACTIVE', '2025-09-25', 'Hợp đồng lao động Chuyên viên Kinh doanh'),
((SELECT id FROM employees WHERE employee_code = 'EMP-0007'), 'HDLD/2025/0008', 'FIXED_TERM_1Y', '2025-07-01', '2026-06-30', 20000000.00, 'ACTIVE', '2025-06-25', 'Hợp đồng lao động Mid Developer'),
((SELECT id FROM employees WHERE employee_code = 'EMP-0008'), 'HDLD/2026/0001', 'PROBATION', '2026-05-01', '2026-06-30', 10000000.00, 'ACTIVE', '2026-04-28', 'Hợp đồng thử việc Junior Developer');


-- ─── 7. INSERT ALLOWANCES FOR EMPLOYEES ─────────────────────────────────────
-- Phụ cấp cơm trưa (không chịu thuế) và Phụ cấp điện thoại (chịu thuế) cho mọi nhân viên
INSERT INTO employee_allowances (employee_id, allowance_type, amount, is_taxable, effective_date, end_date)
SELECT id, 'MEAL', 730000.00, false, '2026-01-01', NULL FROM employees;

INSERT INTO employee_allowances (employee_id, allowance_type, amount, is_taxable, effective_date, end_date)
SELECT id, 'PHONE', 200000.00, true, '2026-01-01', NULL FROM employees;

-- Phụ cấp trách nhiệm cho các cấp Quản lý
INSERT INTO employee_allowances (employee_id, allowance_type, amount, is_taxable, effective_date, end_date) VALUES
((SELECT id FROM employees WHERE employee_code = 'EMP-SUPER'), 'RESPONSIBILITY', 5000000.00, true, '2026-01-01', NULL),
((SELECT id FROM employees WHERE employee_code = 'EMP-HRADM'), 'RESPONSIBILITY', 2000000.00, true, '2026-01-01', NULL),
((SELECT id FROM employees WHERE employee_code = 'EMP-MGR'), 'RESPONSIBILITY', 3000000.00, true, '2026-01-01', NULL),
((SELECT id FROM employees WHERE employee_code = 'EMP-0001'), 'RESPONSIBILITY', 2500000.00, true, '2026-01-01', NULL),
((SELECT id FROM employees WHERE employee_code = 'EMP-0003'), 'RESPONSIBILITY', 2500000.00, true, '2026-01-01', NULL),
((SELECT id FROM employees WHERE employee_code = 'EMP-0005'), 'RESPONSIBILITY', 3000000.00, true, '2026-01-01', NULL);

-- Phụ cấp đi lại/xăng xe cho Nhân viên Kinh doanh
INSERT INTO employee_allowances (employee_id, allowance_type, amount, is_taxable, effective_date, end_date) VALUES
((SELECT id FROM employees WHERE employee_code = 'EMP-0006'), 'TRANSPORT', 500000.00, false, '2026-01-01', NULL);


-- ─── 8. INSERT LEAVE BALANCES FOR 2026 ──────────────────────────────────────
INSERT INTO leave_balances (employee_id, leave_type_id, year, total_days, used_days, pending_days)
SELECT 
    e.id, 
    lt.id, 
    2026,
    CASE 
        WHEN lt.code = 'ANNUAL' THEN 12.0 
        WHEN lt.code = 'SICK' THEN 30.0 
        ELSE 0.0 
    END,
    0.0, 
    0.0
FROM employees e
CROSS JOIN leave_types lt
WHERE lt.code IN ('ANNUAL', 'SICK');


-- ─── 9. INSERT LEAVE REQUESTS ───────────────────────────────────────────────
INSERT INTO leave_requests (employee_id, leave_type_id, start_date, end_date, total_days, reason, status, manager_id, manager_note, reviewed_at, hr_override_by, created_at, updated_at) VALUES
(
    (SELECT id FROM employees WHERE employee_code = 'EMP-EMP'), 
    (SELECT id FROM leave_types WHERE code = 'ANNUAL'), 
    '2026-05-12', '2026-05-13', 2.0, 
    'Giải quyết công việc gia đình ở quê', 'APPROVED', 
    (SELECT id FROM employees WHERE employee_code = 'EMP-MGR'), 
    'Đã bàn giao công việc tốt, đồng ý duyệt', '2026-05-10 09:30:00', NULL, 
    '2026-05-09 14:00:00', '2026-05-10 09:30:00'
),
(
    (SELECT id FROM employees WHERE employee_code = 'EMP-HRSTF'), 
    (SELECT id FROM leave_types WHERE code = 'ANNUAL'), 
    '2026-05-20', '2026-05-20', 1.0, 
    'Khám bệnh định kỳ', 'APPROVED', 
    (SELECT id FROM employees WHERE employee_code = 'EMP-HRADM'), 
    'Duyệt nghỉ phép', '2026-05-19 15:45:00', NULL, 
    '2026-05-19 10:15:00', '2026-05-19 15:45:00'
),
(
    (SELECT id FROM employees WHERE employee_code = 'EMP-0004'), 
    (SELECT id FROM leave_types WHERE code = 'SICK'), 
    '2026-05-18', '2026-05-18', 1.0, 
    'Bị sốt xuất huyết, xin nghỉ điều trị', 'APPROVED', 
    (SELECT id FROM employees WHERE employee_code = 'EMP-0003'), 
    'Giữ gìn sức khỏe, duyệt nghỉ bệnh', '2026-05-18 08:30:00', NULL, 
    '2026-05-18 07:15:00', '2026-05-18 08:30:00'
),
(
    (SELECT id FROM employees WHERE employee_code = 'EMP-0006'), 
    (SELECT id FROM leave_types WHERE code = 'ANNUAL'), 
    '2026-05-25', '2026-05-26', 2.0, 
    'Đi du lịch cá nhân', 'REJECTED', 
    (SELECT id FROM employees WHERE employee_code = 'EMP-0005'), 
    'Không duyệt do trùng đợt chiến dịch bán hàng cao điểm cuối tháng 5. Vui lòng dời lịch.', '2026-05-22 11:20:00', NULL, 
    '2026-05-21 16:30:00', '2026-05-22 11:20:00'
),
(
    (SELECT id FROM employees WHERE employee_code = 'EMP-0008'), 
    (SELECT id FROM leave_types WHERE code = 'ANNUAL'), 
    '2026-06-12', '2026-06-12', 1.0, 
    'Thi cử kết thúc học phần đại học', 'PENDING', 
    (SELECT id FROM employees WHERE employee_code = 'EMP-MGR'), 
    NULL, NULL, NULL, 
    '2026-06-09 11:00:00', '2026-06-09 11:00:00'
);

-- Cập nhậtused_days vào leave_balances dựa trên các request đã được APPROVED trong năm 2026
UPDATE leave_balances lb SET 
    used_days = COALESCE((
        SELECT SUM(lr.total_days) FROM leave_requests lr
        WHERE lr.employee_id = lb.employee_id 
          AND lr.leave_type_id = lb.leave_type_id
          AND lr.status = 'APPROVED'
          AND EXTRACT(YEAR FROM lr.start_date) = 2026
    ), 0.0),
    pending_days = COALESCE((
        SELECT SUM(lr.total_days) FROM leave_requests lr
        WHERE lr.employee_id = lb.employee_id 
          AND lr.leave_type_id = lb.leave_type_id
          AND lr.status = 'PENDING'
          AND EXTRACT(YEAR FROM lr.start_date) = 2026
    ), 0.0)
WHERE lb.year = 2026;


-- ─── 10. GENERATE ATTENDANCE LOGS FOR MAY 2026 ──────────────────────────────
-- Sử dụng PL/pgSQL block sinh tự động log chấm công từ 04/05/2026 đến 29/05/2026 (20 ngày làm việc từ thứ 2-6)
DO $$
DECLARE
    emp RECORD;
    d DATE;
    in_time TIMESTAMP;
    out_time TIMESTAMP;
    att_status VARCHAR(20);
BEGIN
    FOR emp IN SELECT id, employee_code FROM employees LOOP
        -- Quét qua chuỗi ngày của tháng 05/2026
        FOR d IN SELECT generate_series('2026-05-04'::date, '2026-05-29'::date, '1 day'::interval)::date LOOP
            -- Lọc bỏ Thứ 7 (6) và Chủ Nhật (0)
            IF EXTRACT(DOW FROM d) BETWEEN 1 AND 5 THEN
                -- Kiểm tra xem có đơn nghỉ phép được APPROVED trùng với ngày này không
                IF EXISTS (
                    SELECT 1 FROM leave_requests lr 
                    WHERE lr.employee_id = emp.id 
                      AND lr.status = 'APPROVED'
                      AND d BETWEEN lr.start_date AND lr.end_date
                ) THEN
                    -- Nhân viên nghỉ phép có lương
                    INSERT INTO attendance_logs (employee_id, work_date, check_in, check_out, check_in_ip, check_in_location, status, note)
                    VALUES (emp.id, d, NULL, NULL, NULL, NULL, 'LEAVE', 'Nghỉ phép/nghỉ bệnh có lương được phê duyệt');
                ELSE
                    -- Nhân viên đi làm bình thường
                    -- Giả lập đi muộn một vài ngày tiêu biểu để tạo tính thực tế
                    IF (emp.employee_code = 'EMP-EMP' AND d = '2026-05-15') THEN
                        in_time := (d + '08:22:15'::time); -- Trễ 22 phút
                        out_time := (d + '17:05:00'::time);
                        att_status := 'LATE';
                    ELSIF (emp.employee_code = 'EMP-0007' AND d = '2026-05-22') THEN
                        in_time := (d + '08:15:30'::time); -- Trễ 15 phút
                        out_time := (d + '17:00:00'::time);
                        att_status := 'LATE';
                    ELSIF (emp.employee_code = 'EMP-0004' AND d = '2026-05-08') THEN
                        in_time := (d + '07:50:00'::time);
                        out_time := (d + '16:35:00'::time); -- Về sớm
                        att_status := 'EARLY_LEAVE';
                    ELSE
                        -- Đi làm đúng giờ chuẩn chỉ
                        in_time := (d + '07:50:00'::time + (random() * 19 * '1 minute'::interval)); -- Check in lúc 7:50 - 8:09
                        out_time := (d + '17:00:00'::time + (random() * 30 * '1 minute'::interval)); -- Check out lúc 17:00 - 17:30
                        att_status := 'ON_TIME';
                    END IF;

                    INSERT INTO attendance_logs (employee_id, work_date, check_in, check_out, check_in_ip, check_in_location, status)
                    VALUES (emp.id, d, in_time, out_time, '118.70.125.210', 'Văn phòng chính HRMPro', att_status);
                END IF;
            END IF;
        END LOOP;
    END LOOP;
END $$;


-- ─── 11. INSERT ATTENDANCE SUMMARY FOR MAY 2026 ─────────────────────────────
INSERT INTO attendance_summary (employee_id, year, month, work_days, actual_days, late_count, absent_count, overtime_hours)
SELECT 
    employee_id,
    2026 as year,
    5 as month,
    20.0 as work_days, -- 20 ngày công chuẩn
    SUM(CASE WHEN status IN ('ON_TIME', 'LATE', 'EARLY_LEAVE', 'LEAVE') THEN 1.0 ELSE 0.0 END) as actual_days,
    SUM(CASE WHEN status = 'LATE' THEN 1 ELSE 0 END) as late_count,
    SUM(CASE WHEN status = 'ABSENT' THEN 1 ELSE 0 END) as absent_count,
    COALESCE(
        CASE WHEN employee_id = (SELECT id FROM employees WHERE employee_code = 'EMP-EMP') THEN 4.5
             WHEN employee_id = (SELECT id FROM employees WHERE employee_code = 'EMP-0007') THEN 8.0
             ELSE 0.0
        END, 0.0
    ) as overtime_hours
FROM attendance_logs
WHERE EXTRACT(YEAR FROM work_date) = 2026 AND EXTRACT(MONTH FROM work_date) = 5
GROUP BY employee_id;


-- ─── 12. INSERT PAYROLL RUN FOR MAY 2026 ────────────────────────────────────
INSERT INTO payroll_runs (year, month, status, run_by, run_at, published_at, notes) VALUES
(
    2026, 
    5, 
    'PUBLISHED', 
    (SELECT id FROM employees WHERE employee_code = 'EMP-HRADM'), 
    '2026-05-31 17:30:00', 
    '2026-06-01 09:00:00', 
    'Quyết toán lương cán bộ nhân viên tháng 05 năm 2026'
);


-- ─── 13. INSERT PAYSLIPS FOR MAY 2026 ───────────────────────────────────────
-- Chèn chi tiết bảng lương được tính toán chính xác
-- Công thức: Gross = Base + Allowances
-- Bảo hiểm xã hội: 8% (mức trần trích đóng tính trên 46.8tr)
-- Bảo hiểm y tế: 1.5% (mức trần trích đóng tính trên 46.8tr)
-- Bảo hiểm thất nghiệp: 1% (mức trần trích đóng vùng I là 99.2tr)
-- Giảm trừ bản thân: 11,000,000đ. Thuế TNCN tính theo biểu thuế lũy tiến từng phần.

-- 1. CEO Lê Hoàng (Base: 85,000,000 + Phụ cấp: Meal 730,000, Phone 200,000, Trách nhiệm 5,000,000. Tổng Phụ cấp: 5,930,000)
-- Gross: 90,930,000
-- BH: BHXH = 46.8tr * 8% = 3,744,000, BHYT = 46.8tr * 1.5% = 702,000, BHTN = 85tr * 1% = 850,000. Tổng BH = 5,296,000
-- TNTT = Gross - Meal (730,000) = 90,200,000. Giảm trừ = Bản thân (11tr) + BH (5,296,000) = 16,296,000
-- Thu nhập tính thuế (TNTT) = 90,200,000 - 16,296,000 = 73,904,000 (Bậc 6: 30%)
-- Thuế TNCN = 73,904,000 * 30% - 5,850,000 = 16,321,200
-- Net = Gross (90,930,000) - BH (5,296,000) - Thuế TNCN (16,321,200) = 69,312,800
INSERT INTO payslips (payroll_run_id, employee_id, base_salary, total_allowances, gross_salary, social_insurance, health_insurance, unemployment, taxable_income, personal_income_tax, other_deductions, net_salary, actual_work_days, standard_work_days, pdf_url) VALUES
(
    (SELECT id FROM payroll_runs WHERE year = 2026 AND month = 5),
    (SELECT id FROM employees WHERE employee_code = 'EMP-SUPER'),
    85000000.00, 5930000.00, 90930000.00, 3744000.00, 702000.00, 850000.00, 90200000.00, 16321200.00, 0.00, 69312800.00, 20.0, 20.0, 'payroll/202605/payslip-emp-super.pdf'
);

-- 2. Trưởng phòng Nhân sự Nguyễn Thanh Hà (Base: 35,000,000 + Phụ cấp: Meal 730,000, Phone 200,000, Trách nhiệm 2,000,000. Tổng Phụ cấp: 2,930,000)
-- Gross: 37,930,000
-- BH: BHXH = 35tr * 8% = 2,800,000, BHYT = 35tr * 1.5% = 525,000, BHTN = 35tr * 1% = 350,000. Tổng BH = 3,675,000
-- TNTT = 37,930,000 - 730,000 = 37,200,000. Giảm trừ = Bản thân (11tr) + BH (3,675,000) = 14,675,000
-- TNTT = 37,200,000 - 14,675,000 = 22,525,000 (Bậc 4: 20%)
-- Thuế TNCN = 22,525,000 * 20% - 1,650,000 = 2,855,000
-- Net = Gross (37,930,000) - BH (3,675,000) - Thuế TNCN (2,855,000) = 31,400,000
INSERT INTO payslips (payroll_run_id, employee_id, base_salary, total_allowances, gross_salary, social_insurance, health_insurance, unemployment, taxable_income, personal_income_tax, other_deductions, net_salary, actual_work_days, standard_work_days, pdf_url) VALUES
(
    (SELECT id FROM payroll_runs WHERE year = 2026 AND month = 5),
    (SELECT id FROM employees WHERE employee_code = 'EMP-HRADM'),
    35000000.00, 2930000.00, 37930000.00, 2800000.00, 525000.00, 350000.00, 37200000.00, 2855000.00, 0.00, 31400000.00, 20.0, 20.0, 'payroll/202605/payslip-emp-hradm.pdf'
);

-- 3. Trưởng phòng Công nghệ Phạm Anh Tuấn (Base: 50,000,000 + Phụ cấp: Meal 730,000, Phone 200,000, Trách nhiệm 3,000,000. Tổng Phụ cấp: 3,930,000)
-- Gross: 53,930,000
-- BH: BHXH = 46.8tr * 8% = 3,744,000, BHYT = 46.8tr * 1.5% = 702,000, BHTN = 50tr * 1% = 500,000. Tổng BH = 4,946,000
-- TNTT = 53,930,000 - 730,000 = 53,200,000. Giảm trừ = Bản thân (11tr) + BH (4,946,000) = 15,946,000
-- TNTT = 53,200,000 - 15,946,000 = 37,254,000 (Bậc 5: 25%)
-- Thuế TNCN = 37,254,000 * 25% - 3,250,000 = 6,063,500
-- Net = Gross (53,930,000) - BH (4,946,000) - Thuế TNCN (6,063,500) = 42,920,500
INSERT INTO payslips (payroll_run_id, employee_id, base_salary, total_allowances, gross_salary, social_insurance, health_insurance, unemployment, taxable_income, personal_income_tax, other_deductions, net_salary, actual_work_days, standard_work_days, pdf_url) VALUES
(
    (SELECT id FROM payroll_runs WHERE year = 2026 AND month = 5),
    (SELECT id FROM employees WHERE employee_code = 'EMP-MGR'),
    50000000.00, 3930000.00, 53930000.00, 3744000.00, 702000.00, 500000.00, 53200000.00, 6063500.00, 0.00, 42920500.00, 20.0, 20.0, 'payroll/202605/payslip-emp-mgr.pdf'
);

-- 4. Senior Developer Nguyễn Đức Nam (Base: 28,000,000 + Phụ cấp: Meal 730,000, Phone 200,000. Tổng Phụ cấp: 930,000)
-- Nghỉ phép 2 ngày có lương => Vẫn được 20/20 ngày công đầy đủ
-- Gross: 28,930,000
-- BH: BHXH = 28tr * 8% = 2,240,000, BHYT = 28tr * 1.5% = 420,000, BHTN = 28tr * 1% = 280,000. Tổng BH = 2,940,000
-- TNTT = 28,930,000 - 730,000 = 28,200,000. Giảm trừ = Bản thân (11tr) + BH (2,940,000) = 13,940,000
-- TNTT = 28,200,000 - 13,940,000 = 14,260,000 (Bậc 3: 15%)
-- Thuế TNCN = 14,260,000 * 15% - 750,000 = 1,389,000
-- Net = Gross (28,930,000) - BH (2,940,000) - Thuế TNCN (1,389,000) = 24,601,000
INSERT INTO payslips (payroll_run_id, employee_id, base_salary, total_allowances, gross_salary, social_insurance, health_insurance, unemployment, taxable_income, personal_income_tax, other_deductions, net_salary, actual_work_days, standard_work_days, pdf_url) VALUES
(
    (SELECT id FROM payroll_runs WHERE year = 2026 AND month = 5),
    (SELECT id FROM employees WHERE employee_code = 'EMP-EMP'),
    28000000.00, 930000.00, 28930000.00, 2240000.00, 420000.00, 280000.00, 28200000.00, 1389000.00, 0.00, 24601000.00, 20.0, 20.0, 'payroll/202605/payslip-emp-emp.pdf'
);

-- 5. Mid Developer Trịnh Thế Hải (Base: 20,000,000 + Phụ cấp: Meal 730,000, Phone 200,000. Tổng Phụ cấp: 930,000)
-- Gross: 20,930,000
-- BH: BHXH = 20tr * 8% = 1,600,000, BHYT = 20tr * 1.5% = 300,000, BHTN = 20tr * 1% = 200,000. Tổng BH = 2,100,000
-- TNTT = 20,930,000 - 730,000 = 20,200,000. Giảm trừ = Bản thân (11tr) + BH (2,100,000) = 13,100,000
-- TNTT = 20,200,000 - 13,100,000 = 7,100,000 (Bậc 2: 10%)
-- Thuế TNCN = 7,100,000 * 10% - 250,000 = 460,000
-- Net = Gross (20,930,000) - BH (2,100,000) - Thuế TNCN (460,000) = 18,370,000
INSERT INTO payslips (payroll_run_id, employee_id, base_salary, total_allowances, gross_salary, social_insurance, health_insurance, unemployment, taxable_income, personal_income_tax, other_deductions, net_salary, actual_work_days, standard_work_days, pdf_url) VALUES
(
    (SELECT id FROM payroll_runs WHERE year = 2026 AND month = 5),
    (SELECT id FROM employees WHERE employee_code = 'EMP-0007'),
    20000000.00, 930000.00, 20930000.00, 1600000.00, 300000.00, 200000.00, 20200000.00, 460000.00, 0.00, 18370000.00, 20.0, 20.0, 'payroll/202605/payslip-emp-0007.pdf'
);

-- 6. Junior Developer Hoàng Trung Dũng (Thử việc 80% lương - Base: 10,000,000 * 85% = 8,500,000. Phụ cấp: Meal 730,000, Phone 200,000. Tổng Phụ cấp: 930,000)
-- Thử việc không phải đóng bảo hiểm bắt buộc theo luật (nếu ký hợp đồng thử việc dưới 3 tháng và chưa vào chính thức, hoặc đóng tối thiểu. Giả sử thử việc không khấu trừ bảo hiểm)
-- Gross: 9,430,000
-- BH = 0
-- TNTT = Gross - Meal = 8,700,000. Giảm trừ bản thân: 11,000,000 => TNTT < 0 => Thuế TNCN = 0
-- Net = Gross = 9,430,000
INSERT INTO payslips (payroll_run_id, employee_id, base_salary, total_allowances, gross_salary, social_insurance, health_insurance, unemployment, taxable_income, personal_income_tax, other_deductions, net_salary, actual_work_days, standard_work_days, pdf_url) VALUES
(
    (SELECT id FROM payroll_runs WHERE year = 2026 AND month = 5),
    (SELECT id FROM employees WHERE employee_code = 'EMP-0008'),
    8500000.00, 930000.00, 9430000.00, 0.00, 0.00, 0.00, 8700000.00, 0.00, 0.00, 9430000.00, 20.0, 20.0, 'payroll/202605/payslip-emp-0008.pdf'
);

-- 7. Kế toán trưởng Phan Khánh Linh (Base: 40,000,000 + Phụ cấp: Meal 730,000, Phone 200,000, Trách nhiệm 2,500,000. Tổng Phụ cấp: 3,430,000)
-- Gross: 43,430,000
-- BH: BHXH = 40tr * 8% = 3,200,000, BHYT = 40tr * 1.5% = 600,000, BHTN = 40tr * 1% = 400,000. Tổng BH = 4,200,000
-- TNTT = 43,430,000 - 730,000 = 42,700,000. Giảm trừ = Bản thân (11tr) + BH (4,200,000) = 15,200,000
-- TNTT = 42,700,000 - 15,200,000 = 27,500,000 (Bậc 4: 20%)
-- Thuế TNCN = 27,500,000 * 20% - 1,650,000 = 3,850,000
-- Net = Gross (43,430,000) - BH (4,200,000) - Thuế TNCN (3,850,000) = 35,380,000
INSERT INTO payslips (payroll_run_id, employee_id, base_salary, total_allowances, gross_salary, social_insurance, health_insurance, unemployment, taxable_income, personal_income_tax, other_deductions, net_salary, actual_work_days, standard_work_days, pdf_url) VALUES
(
    (SELECT id FROM payroll_runs WHERE year = 2026 AND month = 5),
    (SELECT id FROM employees WHERE employee_code = 'EMP-0001'),
    40000000.00, 3430000.00, 43430000.00, 3200000.00, 600000.00, 400000.00, 42700000.00, 3850000.00, 0.00, 35380000.00, 20.0, 20.0, 'payroll/202605/payslip-emp-0001.pdf'
);

-- 8. Kế toán viên Nguyễn Thái Bình (Base: 14,000,000 + Phụ cấp: Meal 730,000, Phone 200,000. Tổng Phụ cấp: 930,000)
-- Gross: 14,930,000
-- BH: BHXH = 14tr * 8% = 1,120,000, BHYT = 14tr * 1.5% = 210,000, BHTN = 14tr * 1% = 140,000. Tổng BH = 1,470,000
-- TNTT = 14,930,000 - 730,000 = 14,200,000. Giảm trừ = Bản thân (11tr) + BH (1,470,000) = 12,470,000
-- TNTT = 14,200,000 - 12,470,000 = 1,730,000 (Bậc 1: 5%)
-- Thuế TNCN = 1,730,000 * 5% = 86,500
-- Net = Gross (14,930,000) - BH (1,470,000) - Thuế TNCN (86,500) = 13,373,500
INSERT INTO payslips (payroll_run_id, employee_id, base_salary, total_allowances, gross_salary, social_insurance, health_insurance, unemployment, taxable_income, personal_income_tax, other_deductions, net_salary, actual_work_days, standard_work_days, pdf_url) VALUES
(
    (SELECT id FROM payroll_runs WHERE year = 2026 AND month = 5),
    (SELECT id FROM employees WHERE employee_code = 'EMP-0002'),
    14000000.00, 930000.00, 14930000.00, 1120000.00, 210000.00, 140000.00, 14200000.00, 86500.00, 0.00, 13373500.00, 20.0, 20.0, 'payroll/202605/payslip-emp-0002.pdf'
);

-- 9. Trưởng phòng Marketing Đặng Hồng Sơn (Base: 38,000,000 + Phụ cấp: Meal 730,000, Phone 200,000, Trách nhiệm 2,500,000. Tổng Phụ cấp: 3,430,000)
-- Gross: 41,430,000
-- BH: BHXH = 38tr * 8% = 3,040,000, BHYT = 38tr * 1.5% = 570,000, BHTN = 38tr * 1% = 380,000. Tổng BH = 3,990,000
-- TNTT = 41,430,000 - 730,000 = 40,700,000. Giảm trừ = Bản thân (11tr) + BH (3,990,000) = 14,990,000
-- TNTT = 40,700,000 - 14,990,000 = 25,710,000 (Bậc 4: 20%)
-- Thuế TNCN = 25,710,000 * 20% - 1,650,000 = 3,492,000
-- Net = Gross (41,430,000) - BH (3,990,000) - Thuế TNCN (3,492,000) = 33,948,000
INSERT INTO payslips (payroll_run_id, employee_id, base_salary, total_allowances, gross_salary, social_insurance, health_insurance, unemployment, taxable_income, personal_income_tax, other_deductions, net_salary, actual_work_days, standard_work_days, pdf_url) VALUES
(
    (SELECT id FROM payroll_runs WHERE year = 2026 AND month = 5),
    (SELECT id FROM employees WHERE employee_code = 'EMP-0003'),
    38000000.00, 3430000.00, 41430000.00, 3040000.00, 570000.00, 380000.00, 40700000.00, 3492000.00, 0.00, 33948000.00, 20.0, 20.0, 'payroll/202605/payslip-emp-0003.pdf'
);

-- 10. Chuyên viên Marketing Phạm Thùy Dương (Base: 15,000,000 + Phụ cấp: Meal 730,000, Phone 200,000. Tổng Phụ cấp: 930,000)
-- Nghỉ bệnh 1 ngày được duyệt => Vẫn đầy đủ 20/20 ngày công
-- Gross: 15,930,000
-- BH: BHXH = 15tr * 8% = 1,200,000, BHYT = 15tr * 1.5% = 225,000, BHTN = 15tr * 1% = 150,000. Tổng BH = 1,575,000
-- TNTT = 15,930,000 - 730,000 = 15,200,000. Giảm trừ = Bản thân (11tr) + BH (1,575,000) = 12,575,000
-- TNTT = 15,200,000 - 12,575,000 = 2,625,000 (Bậc 1: 5%)
-- Thuế TNCN = 2,625,000 * 5% = 131,250
-- Net = Gross (15,930,000) - BH (1,575,000) - Thuế TNCN (131,250) = 14,223,750
INSERT INTO payslips (payroll_run_id, employee_id, base_salary, total_allowances, gross_salary, social_insurance, health_insurance, unemployment, taxable_income, personal_income_tax, other_deductions, net_salary, actual_work_days, standard_work_days, pdf_url) VALUES
(
    (SELECT id FROM payroll_runs WHERE year = 2026 AND month = 5),
    (SELECT id FROM employees WHERE employee_code = 'EMP-0004'),
    15000000.00, 930000.00, 15930000.00, 1200000.00, 225000.00, 150000.00, 15200000.00, 131250.00, 0.00, 14223750.00, 20.0, 20.0, 'payroll/202605/payslip-emp-0004.pdf'
);

-- 11. Trưởng phòng Kinh doanh Ngô Minh Quang (Base: 42,000,000 + Phụ cấp: Meal 730,000, Phone 200,000, Trách nhiệm 3,000,000. Tổng Phụ cấp: 3,930,000)
-- Gross: 45,930,000
-- BH: BHXH = 42tr * 8% = 3,360,000, BHYT = 42tr * 1.5% = 630,000, BHTN = 42tr * 1% = 420,000. Tổng BH = 4,410,000
-- TNTT = 45,930,000 - 730,000 = 45,200,000. Giảm trừ = Bản thân (11tr) + BH (4,410,000) = 15,410,000
-- TNTT = 45,200,000 - 15,410,000 = 29,790,000 (Bậc 4: 20%)
-- Thuế TNCN = 29,790,000 * 20% - 1,650,000 = 4,308,000
-- Net = Gross (45,930,000) - BH (4,410,000) - Thuế TNCN (4,308,000) = 37,212,000
INSERT INTO payslips (payroll_run_id, employee_id, base_salary, total_allowances, gross_salary, social_insurance, health_insurance, unemployment, taxable_income, personal_income_tax, other_deductions, net_salary, actual_work_days, standard_work_days, pdf_url) VALUES
(
    (SELECT id FROM payroll_runs WHERE year = 2026 AND month = 5),
    (SELECT id FROM employees WHERE employee_code = 'EMP-0005'),
    42000000.00, 3930000.00, 45930000.00, 3360000.00, 630000.00, 420000.00, 45200000.00, 4308000.00, 0.00, 37212000.00, 20.0, 20.0, 'payroll/202605/payslip-emp-0005.pdf'
);

-- 12. Chuyên viên Kinh doanh Đỗ Mai Hương (Base: 13,000,000 + Phụ cấp: Meal 730,000, Phone 200,000, Transport 500,000. Tổng Phụ cấp: 1,430,000)
-- Gross: 14,430,000
-- BH: BHXH = 13tr * 8% = 1,040,000, BHYT = 13tr * 1.5% = 195,000, BHTN = 13tr * 1% = 130,000. Tổng BH = 1,365,000
-- TNTT = Gross - Meal (730,000) - Transport (500,000) = 13,200,000. Giảm trừ = Bản thân (11tr) + BH (1,365,000) = 12,365,000
-- TNTT = 13,200,000 - 12,365,000 = 835,000 (Bậc 1: 5%)
-- Thuế TNCN = 835,000 * 5% = 41,750
-- Net = Gross (14,430,000) - BH (1,365,000) - Thuế TNCN (41,750) = 13,023,250
INSERT INTO payslips (payroll_run_id, employee_id, base_salary, total_allowances, gross_salary, social_insurance, health_insurance, unemployment, taxable_income, personal_income_tax, other_deductions, net_salary, actual_work_days, standard_work_days, pdf_url) VALUES
(
    (SELECT id FROM payroll_runs WHERE year = 2026 AND month = 5),
    (SELECT id FROM employees WHERE employee_code = 'EMP-0006'),
    13000000.00, 1430000.00, 14430000.00, 1040000.00, 195000.00, 130000.00, 13200000.00, 41750.00, 0.00, 13023250.00, 20.0, 20.0, 'payroll/202605/payslip-emp-0006.pdf'
);

-- 13. Chuyên viên Nhân sự Trần Hương Ly (Base: 18,000,000 + Phụ cấp: Meal 730,000, Phone 200,000. Tổng Phụ cấp: 930,000)
-- Nghỉ phép 1 ngày được duyệt => Vẫn đầy đủ 20/20 ngày công
-- Gross: 18,930,000
-- BH: BHXH = 18tr * 8% = 1,440,000, BHYT = 18tr * 1.5% = 270,000, BHTN = 18tr * 1% = 180,000. Tổng BH = 1,890,000
-- TNTT = 18,930,000 - 730,000 = 18,200,000. Giảm trừ = Bản thân (11tr) + BH (1,890,000) = 12,890,000
-- TNTT = 18,200,000 - 12,890,000 = 5,310,000 (Bậc 2: 10%)
-- Thuế TNCN = 5,310,000 * 10% - 250,000 = 281,000
-- Net = Gross (18,930,000) - BH (1,890,000) - Thuế TNCN (281,000) = 16,759,000
INSERT INTO payslips (payroll_run_id, employee_id, base_salary, total_allowances, gross_salary, social_insurance, health_insurance, unemployment, taxable_income, personal_income_tax, other_deductions, net_salary, actual_work_days, standard_work_days, pdf_url) VALUES
(
    (SELECT id FROM payroll_runs WHERE year = 2026 AND month = 5),
    (SELECT id FROM employees WHERE employee_code = 'EMP-HRSTF'),
    18000000.00, 930000.00, 18930000.00, 1440000.00, 270000.00, 180000.00, 18200000.00, 281000.00, 0.00, 16759000.00, 20.0, 20.0, 'payroll/202605/payslip-emp-hrstf.pdf'
);

-- 14. Chuyên viên Tuyển dụng Vũ Phương Thảo (Base: 16,000,000 + Phụ cấp: Meal 730,000, Phone 200,000. Tổng Phụ cấp: 930,000)
-- Gross: 16,930,000
-- BH: BHXH = 16tr * 8% = 1,280,000, BHYT = 16tr * 1.5% = 240,000, BHTN = 16tr * 1% = 160,000. Tổng BH = 1,680,000
-- TNTT = 16,930,000 - 730,000 = 16,200,000. Giảm trừ = Bản thân (11tr) + BH (1,680,000) = 12,680,000
-- TNTT = 16,200,000 - 12,680,000 = 3,520,000 (Bậc 1: 5%)
-- Thuế TNCN = 3,520,000 * 5% = 176,000
-- Net = Gross (16,930,000) - BH (1,680,000) - Thuế TNCN (176,000) = 15,074,000
INSERT INTO payslips (payroll_run_id, employee_id, base_salary, total_allowances, gross_salary, social_insurance, health_insurance, unemployment, taxable_income, personal_income_tax, other_deductions, net_salary, actual_work_days, standard_work_days, pdf_url) VALUES
(
    (SELECT id FROM payroll_runs WHERE year = 2026 AND month = 5),
    (SELECT id FROM employees WHERE employee_code = 'EMP-REC'),
    16000000.00, 930000.00, 16930000.00, 1280000.00, 240000.00, 160000.00, 16200000.00, 176000.00, 0.00, 15074000.00, 20.0, 20.0, 'payroll/202605/payslip-emp-rec.pdf'
);


-- ─── 14. INSERT PERFORMANCE REVIEWS ──────────────────────────────────────────
-- Chu kỳ đánh giá hiệu suất Q1 2026
INSERT INTO review_cycles (name, cycle_type, start_date, end_date, status) VALUES
('Đánh giá định kỳ Quý 1/2026', 'QUARTERLY', '2026-01-01', '2026-03-31', 'COMPLETED');

-- Tạo bảng đánh giá nhân viên (Reviews)
INSERT INTO performance_reviews (cycle_id, employee_id, reviewer_id, self_score, reviewer_score, final_score, rating, strengths, improvements, goals_next, status, completed_at) VALUES
(
    (SELECT id FROM review_cycles WHERE name = 'Đánh giá định kỳ Quý 1/2026'),
    (SELECT id FROM employees WHERE employee_code = 'EMP-EMP'), -- Senior Dev Nguyễn Đức Nam
    (SELECT id FROM employees WHERE employee_code = 'EMP-MGR'), -- Reviewer: Tech Lead Phạm Anh Tuấn
    4.20, 4.50, 4.40, 'EXCELLENT', 
    'Làm việc chủ động, dẫn dắt tốt team hoàn thành dự án HRMPro đúng tiến độ. Kỹ năng kỹ thuật và giải quyết vấn đề xuất sắc.', 
    'Cần cải thiện kỹ năng thuyết trình và giao tiếp với các phòng ban kinh doanh.', 
    'Đóng vai trò chính trong nâng cấp hệ thống microservices tiếp theo, nâng cao chỉ số coverage test lên 85%.', 
    'COMPLETED', '2026-04-10 14:00:00'
),
(
    (SELECT id FROM review_cycles WHERE name = 'Đánh giá định kỳ Quý 1/2026'),
    (SELECT id FROM employees WHERE employee_code = 'EMP-HRSTF'), -- HR Staff Trần Hương Ly
    (SELECT id FROM employees WHERE employee_code = 'EMP-HRADM'), -- Reviewer: HR Manager Nguyễn Thanh Hà
    3.80, 4.00, 3.90, 'GOOD', 
    'Cẩn thận, chu đáo trong khâu làm hồ sơ và tính lương. Hỗ trợ nhiệt tình các phòng ban giải quyết chế độ phúc lợi.', 
    'Cần chủ động đề xuất giải pháp cải tiến quy trình thay vì chỉ thực thi các tác vụ được giao.', 
    'Tự động hóa hoàn toàn quy trình lập hồ sơ nhân viên mới, hoàn thành chứng chỉ quản trị nhân sự.', 
    'COMPLETED', '2026-04-12 10:30:00'
);

-- KPI chi tiết (kpi_records)
INSERT INTO kpi_records (review_id, kpi_name, weight, target, actual, score) VALUES
(
    (SELECT id FROM performance_reviews WHERE employee_id = (SELECT id FROM employees WHERE employee_code = 'EMP-EMP')),
    'Hoàn thành dự án HRMPro đúng hạn', 40.00, 'On-time delivery (100%)', '100% bàn giao đúng hạn', 4.50
),
(
    (SELECT id FROM performance_reviews WHERE employee_id = (SELECT id FROM employees WHERE employee_code = 'EMP-EMP')),
    'Chất lượng code và bảo mật', 30.00, 'SonarQube Quality Gate Passed, <5% Bug/Vulnerability', 'Passed Quality Gate, 0 Vulnerabilities', 4.20
),
(
    (SELECT id FROM performance_reviews WHERE employee_id = (SELECT id FROM employees WHERE employee_code = 'EMP-EMP')),
    'Hỗ trợ và hướng dẫn junior', 30.00, 'Mentoring 2 juniors, hoàn thành đào tạo thử việc', 'Đã hướng dẫn và giúp 2 junior onboard thành công', 4.50
),
(
    (SELECT id FROM performance_reviews WHERE employee_id = (SELECT id FROM employees WHERE employee_code = 'EMP-HRSTF')),
    'Độ chính xác và thời gian tính lương', 40.00, 'Tính lương đúng hạn trước ngày 30 hàng tháng, tỷ lệ sai sót < 1%', 'Tính lương đúng hạn, 0 lỗi sai sót', 4.00
),
(
    (SELECT id FROM performance_reviews WHERE employee_id = (SELECT id FROM employees WHERE employee_code = 'EMP-HRSTF')),
    'Khảo sát mức độ hài lòng về phúc lợi', 30.00, 'Độ hài lòng nhân viên > 80%', 'Đạt 82% độ hài lòng', 3.80
),
(
    (SELECT id FROM performance_reviews WHERE employee_id = (SELECT id FROM employees WHERE employee_code = 'EMP-HRSTF')),
    'Quản lý hồ sơ nhân sự số hóa', 30.00, 'Số hóa 100% hồ sơ nhân viên mới lên hệ thống', 'Đã số hóa đầy đủ', 4.00
);


-- ─── 15. INSERT RECRUITMENT DATA ────────────────────────────────────────────
-- 1. Tin tuyển dụng (Job Postings)
INSERT INTO job_postings (title, department_id, position_id, description, requirements, salary_range, headcount, posting_date, closing_date, status, created_by) VALUES
(
    'Senior Java Developer (Spring Boot, Microservices)', 
    (SELECT id FROM departments WHERE code = 'DEP-TECH'), 
    (SELECT id FROM positions WHERE code = 'POS-DEV-SR'), 
    'Chúng tôi đang tìm kiếm Senior Java Developer để dẫn dắt phát triển hệ thống HRMPro cốt lõi, thiết kế kiến trúc backend hiệu năng cao và giải quyết các bài toán kỹ thuật lớn.', 
    '- Trên 5 năm kinh nghiệm lập trình Java, Spring Boot.\n- Hiểu biết sâu sắc về Microservices, Kafka, Redis, PostgreSQL.\n- Có kinh nghiệm CI/CD, Docker/Kubernetes là lợi thế.', 
    '30,000,000 - 45,000,000 VND', 2, '2026-05-10', '2026-06-30', 'OPEN', 
    (SELECT id FROM employees WHERE employee_code = 'EMP-REC')
),
(
    'Chuyên viên Tuyển dụng nhân sự (HR Recruiter)', 
    (SELECT id FROM departments WHERE code = 'DEP-HR'), 
    (SELECT id FROM positions WHERE code = 'POS-HR-REC'), 
    'Chịu trách nhiệm toàn bộ quy trình thu hút tài năng công nghệ, tuyển dụng các vị trí lập trình viên và quản lý cấp trung.', 
    '- Trên 2 năm kinh nghiệm tuyển dụng trong mảng CNTT/IT.\n- Kỹ năng giao tiếp và đàm phán tốt.\n- Có mạng lưới kết nối ứng viên rộng.', 
    '15,000,000 - 22,000,000 VND', 1, '2026-05-15', '2026-06-15', 'OPEN', 
    (SELECT id FROM employees WHERE employee_code = 'EMP-REC')
);

-- 2. Hồ sơ ứng viên (Applications)
INSERT INTO applications (job_posting_id, candidate_name, candidate_email, candidate_phone, cv_url, cover_letter, source, stage, applied_at, updated_at) VALUES
(
    (SELECT id FROM job_postings WHERE title LIKE 'Senior Java Developer%'), 
    'Phạm Quốc Đạt', 'dat.phamquoc@gmail.com', '0987654321', 
    'resumes/cv-dat-phamquoc.pdf', 'Tôi rất mong muốn được cống hiến kinh nghiệm làm Java 6 năm của mình tại doanh nghiệp.', 
    'LINKEDIN', 'INTERVIEW', '2026-05-12 10:00:00', '2026-05-14 09:00:00'
),
(
    (SELECT id FROM job_postings WHERE title LIKE 'Senior Java Developer%'), 
    'Trần Văn Minh', 'minh.tranvan@gmail.com', '0988776655', 
    'resumes/cv-minh-tranvan.pdf', 'Tôi ứng tuyển vị trí Senior Java Developer.', 
    'INDEED', 'REJECTED', '2026-05-14 11:30:00', '2026-05-15 16:00:00'
),
(
    (SELECT id FROM job_postings WHERE title LIKE 'Chuyên viên Tuyển dụng%'), 
    'Nguyễn Thị Mai', 'mai.nguyenhr@gmail.com', '0977665544', 
    'resumes/cv-mai-nguyen.pdf', 'Đơn ứng tuyển Chuyên viên Tuyển dụng.', 
    'WEBSITE', 'OFFER', '2026-05-18 14:00:00', '2026-05-25 10:00:00'
);

-- Cập nhật lý do từ chối
UPDATE applications SET rejected_reason = 'Kinh nghiệm lập trình Java chưa đủ (chỉ có 2 năm, yêu cầu Senior trên 5 năm)'
WHERE candidate_name = 'Trần Văn Minh';

-- 3. Phỏng vấn (Interviews)
INSERT INTO interviews (application_id, round, interview_type, scheduled_at, duration_minutes, location, meeting_url, interviewers, result, feedback, created_at) VALUES
(
    (SELECT id FROM applications WHERE candidate_name = 'Phạm Quốc Đạt'),
    1, 'ONLINE', '2026-05-15 14:00:00', 45, 'Google Meet', 'https://meet.google.com/abc-xyz-123', 
    '[(SELECT id FROM employees WHERE employee_code = "EMP-REC")]', 'PASSED', 
    'Ứng viên thái độ tốt, giao tiếp lưu loát, pass vòng lọc HR đầu tiên.', '2026-05-14 09:00:00'
),
(
    (SELECT id FROM applications WHERE candidate_name = 'Phạm Quốc Đạt'),
    2, 'TECHNICAL', '2026-05-19 10:00:00', 90, 'Phòng họp Tech Room', NULL, 
    '[(SELECT id FROM employees WHERE employee_code = "EMP-MGR"), (SELECT id FROM employees WHERE employee_code = "EMP-EMP")]', 'PASSED', 
    'Kiến thức Core Java và System Design tốt. Đã từng làm việc với High Concurrency. Đánh giá tốt.', '2026-05-16 11:00:00'
),
(
    (SELECT id FROM applications WHERE candidate_name = 'Nguyễn Thị Mai'),
    1, 'ONSITE', '2026-05-22 09:30:00', 60, 'Phòng tuyển dụng HN', NULL, 
    '[(SELECT id FROM employees WHERE employee_code = "EMP-REC"), (SELECT id FROM employees WHERE employee_code = "EMP-HRADM")]', 'PASSED', 
    'Ứng viên kinh nghiệm dồi dào, hiểu biết sâu về tuyển dụng công nghệ. Đề xuất gửi offer.', '2026-05-20 15:00:00'
);


-- ─── 16. INSERT NOTIFICATIONS ──────────────────────────────────────────────
INSERT INTO notifications (recipient_id, type, title, message, is_read, related_url, created_at) VALUES
(
    (SELECT id FROM employees WHERE employee_code = 'EMP-EMP'),
    'PAYSLIP_READY', 'Phiếu lương Tháng 5/2026 sẵn sàng', 
    'Phiếu lương của bạn trong đợt tính lương Tháng 5/2026 đã được phê duyệt và phát hành. Vui lòng kiểm tra thông tin chi tiết.', 
    false, '/payroll/payslip', '2026-06-01 09:05:00'
),
(
    (SELECT id FROM employees WHERE employee_code = 'EMP-MGR'),
    'LEAVE_REQUEST', 'Đơn xin nghỉ phép mới cần phê duyệt', 
    'Nhân viên Hoàng Trung Dũng đã gửi đơn xin nghỉ phép năm ngày 12/06/2026 cần bạn xét duyệt.', 
    false, '/leave/requests', '2026-06-09 11:02:00'
),
(
    (SELECT id FROM employees WHERE employee_code = 'EMP-SUPER'),
    'REVIEW_DUE', 'Kỳ đánh giá hiệu suất Q1/2026 hoàn tất', 
    'Báo cáo tổng hợp đánh giá hiệu suất nhân sự Quý 1 năm 2026 đã được xuất bản hoàn thành.', 
    true, '/performance/reports', '2026-04-15 08:00:00'
);


-- ─── 17. INSERT AUDIT LOGS ──────────────────────────────────────────────────
INSERT INTO audit_logs (username, action, method, request_uri, ip_address, status, payload, created_at) VALUES
('superadmin', 'Đăng nhập hệ thống', 'POST', '/api/v1/auth/login', '192.168.1.10', 200, NULL, '2026-06-10 08:30:15'),
('hradmin', 'Duyệt bảng lương Tháng 5/2026', 'POST', '/api/v1/payroll/runs/1/publish', '192.168.1.15', 200, '{"runId":1,"year":2026,"month":5}', '2026-06-01 09:00:00'),
('manager', 'Phê duyệt đơn nghỉ phép của EMP-EMP', 'PUT', '/api/v1/leave/requests/1/approve', '192.168.1.20', 200, '{"note":"Đã bàn giao công việc tốt, đồng ý duyệt"}', '2026-05-10 09:30:00'),
('recruiter', 'Tạo tin tuyển dụng Senior Java Dev', 'POST', '/api/v1/recruitment/jobs', '192.168.1.25', 201, '{"title":"Senior Java Developer","headcount":2}', '2026-05-10 10:15:00');
