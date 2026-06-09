-- V2__insert_test_accounts.sql
-- Password for all accounts is '123456' using BCrypt (strength 10)
-- Hash: $2a$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGG.X.gC

-- Insert basic employees to link with users
INSERT INTO employees (employee_code, first_name, last_name, email, hire_date, status) VALUES
('EMP-SUPER', 'Super', 'Admin', 'superadmin@hrmpro.com', '2024-01-01', 'ACTIVE'),
('EMP-HRADM', 'HR', 'Admin', 'hradmin@hrmpro.com', '2024-01-01', 'ACTIVE'),
('EMP-HRSTF', 'HR', 'Staff', 'hrstaff@hrmpro.com', '2024-01-01', 'ACTIVE'),
('EMP-MGR', 'Manager', 'User', 'manager@hrmpro.com', '2024-01-01', 'ACTIVE'),
('EMP-EMP', 'Employee', 'User', 'employee@hrmpro.com', '2024-01-01', 'ACTIVE'),
('EMP-REC', 'Recruiter', 'User', 'recruiter@hrmpro.com', '2024-01-01', 'ACTIVE');

-- Insert users
INSERT INTO users (username, password, employee_id, is_active) VALUES
('superadmin', '$2a$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGG.X.gC', (SELECT id FROM employees WHERE employee_code = 'EMP-SUPER'), true),
('hradmin', '$2a$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGG.X.gC', (SELECT id FROM employees WHERE employee_code = 'EMP-HRADM'), true),
('hrstaff', '$2a$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGG.X.gC', (SELECT id FROM employees WHERE employee_code = 'EMP-HRSTF'), true),
('manager', '$2a$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGG.X.gC', (SELECT id FROM employees WHERE employee_code = 'EMP-MGR'), true),
('employee', '$2a$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGG.X.gC', (SELECT id FROM employees WHERE employee_code = 'EMP-EMP'), true),
('recruiter', '$2a$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGG.X.gC', (SELECT id FROM employees WHERE employee_code = 'EMP-REC'), true);

-- Assign roles to users based on role ids (from V1 init schema, SUPER_ADMIN=1, HR_ADMIN=2, HR_STAFF=3, MANAGER=4, EMPLOYEE=5, RECRUITER=6)
-- We will dynamically select to be safe
INSERT INTO user_roles (user_id, role_id) VALUES
((SELECT id FROM users WHERE username = 'superadmin'), (SELECT id FROM roles WHERE name = 'SUPER_ADMIN')),
((SELECT id FROM users WHERE username = 'hradmin'), (SELECT id FROM roles WHERE name = 'HR_ADMIN')),
((SELECT id FROM users WHERE username = 'hrstaff'), (SELECT id FROM roles WHERE name = 'HR_STAFF')),
((SELECT id FROM users WHERE username = 'manager'), (SELECT id FROM roles WHERE name = 'MANAGER')),
((SELECT id FROM users WHERE username = 'employee'), (SELECT id FROM roles WHERE name = 'EMPLOYEE')),
((SELECT id FROM users WHERE username = 'recruiter'), (SELECT id FROM roles WHERE name = 'RECRUITER'));
