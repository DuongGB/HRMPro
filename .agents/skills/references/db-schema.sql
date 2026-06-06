-- =============================================
-- HRMPro — PostgreSQL Schema (v1.0)
-- =============================================

-- ─── ORGANIZATION ────────────────────────────

CREATE TABLE departments (
    id              BIGSERIAL PRIMARY KEY,
    code            VARCHAR(20) UNIQUE NOT NULL,    -- DEP-HR, DEP-TECH
    name            VARCHAR(200) NOT NULL,
    parent_id       BIGINT REFERENCES departments(id),  -- phân cấp phòng ban
    manager_id      BIGINT,                          -- FK → employees (set sau)
    description     TEXT,
    is_active       BOOLEAN DEFAULT TRUE,
    created_at      TIMESTAMP DEFAULT NOW(),
    updated_at      TIMESTAMP DEFAULT NOW()
);

CREATE TABLE positions (
    id              BIGSERIAL PRIMARY KEY,
    code            VARCHAR(20) UNIQUE NOT NULL,    -- POS-DEV-SR, POS-HR-MGR
    name            VARCHAR(200) NOT NULL,
    department_id   BIGINT REFERENCES departments(id),
    level           VARCHAR(30),                    -- INTERN|JUNIOR|MIDDLE|SENIOR|LEAD|MANAGER|DIRECTOR
    description     TEXT,
    is_active       BOOLEAN DEFAULT TRUE,
    created_at      TIMESTAMP DEFAULT NOW(),
    updated_at      TIMESTAMP DEFAULT NOW()
);

-- ─── EMPLOYEES ───────────────────────────────

CREATE TABLE employees (
    id                  BIGSERIAL PRIMARY KEY,
    employee_code       VARCHAR(20) UNIQUE NOT NULL,    -- EMP-0001
    first_name          VARCHAR(100) NOT NULL,
    last_name           VARCHAR(100) NOT NULL,
    email               VARCHAR(150) UNIQUE NOT NULL,
    personal_email      VARCHAR(150),
    phone               VARCHAR(20),
    date_of_birth       DATE,
    gender              VARCHAR(10),                    -- MALE|FEMALE|OTHER
    id_card_number      VARCHAR(20) UNIQUE,             -- CCCD/CMND
    id_card_issued_date DATE,
    id_card_issued_place VARCHAR(200),
    permanent_address   TEXT,
    current_address     TEXT,
    avatar_url          TEXT,                           -- MinIO object key
    hire_date           DATE NOT NULL,
    probation_end_date  DATE,
    termination_date    DATE,
    status              VARCHAR(20) DEFAULT 'PROBATION', -- ACTIVE|PROBATION|ON_LEAVE|TERMINATED
    department_id       BIGINT REFERENCES departments(id),
    position_id         BIGINT REFERENCES positions(id),
    manager_id          BIGINT REFERENCES employees(id),
    tax_code            VARCHAR(20),
    bank_account_number VARCHAR(30),
    bank_name           VARCHAR(100),
    social_insurance_id VARCHAR(20),
    created_at          TIMESTAMP DEFAULT NOW(),
    updated_at          TIMESTAMP DEFAULT NOW(),
    created_by          VARCHAR(100)
);

-- FK manager vào departments sau khi tạo employees
ALTER TABLE departments ADD CONSTRAINT fk_dept_manager
    FOREIGN KEY (manager_id) REFERENCES employees(id);

CREATE TABLE contracts (
    id              BIGSERIAL PRIMARY KEY,
    employee_id     BIGINT NOT NULL REFERENCES employees(id),
    contract_number VARCHAR(50) UNIQUE NOT NULL,
    contract_type   VARCHAR(30),                    -- PROBATION|FIXED_TERM_1Y|FIXED_TERM_3Y|INDEFINITE
    start_date      DATE NOT NULL,
    end_date        DATE,
    base_salary     NUMERIC(15,2) NOT NULL,
    document_url    TEXT,                           -- MinIO object key
    status          VARCHAR(20) DEFAULT 'ACTIVE',   -- ACTIVE|EXPIRED|TERMINATED
    signed_at       DATE,
    notes           TEXT,
    created_at      TIMESTAMP DEFAULT NOW()
);

-- ─── AUTH & RBAC ─────────────────────────────

CREATE TABLE users (
    id              BIGSERIAL PRIMARY KEY,
    username        VARCHAR(100) UNIQUE NOT NULL,
    password        VARCHAR(255) NOT NULL,           -- BCrypt
    employee_id     BIGINT UNIQUE REFERENCES employees(id),
    is_active       BOOLEAN DEFAULT TRUE,
    last_login      TIMESTAMP,
    created_at      TIMESTAMP DEFAULT NOW()
);

CREATE TABLE roles (
    id      BIGSERIAL PRIMARY KEY,
    name    VARCHAR(50) UNIQUE NOT NULL              -- SUPER_ADMIN|HR_ADMIN|HR_STAFF|MANAGER|EMPLOYEE|RECRUITER
);

CREATE TABLE user_roles (
    user_id     BIGINT REFERENCES users(id),
    role_id     BIGINT REFERENCES roles(id),
    PRIMARY KEY (user_id, role_id)
);

-- ─── SALARY CONFIG ───────────────────────────

CREATE TABLE salary_configs (
    id                      BIGSERIAL PRIMARY KEY,
    effective_date          DATE NOT NULL,
    min_wage                NUMERIC(15,2),           -- Lương tối thiểu vùng
    social_insurance_rate   DECIMAL(5,2) DEFAULT 8.00,    -- 8% NLĐ đóng
    health_insurance_rate   DECIMAL(5,2) DEFAULT 1.50,    -- 1.5%
    unemployment_rate       DECIMAL(5,2) DEFAULT 1.00,    -- 1%
    personal_deduction      NUMERIC(15,2) DEFAULT 11000000, -- 11 triệu/tháng
    dependent_deduction     NUMERIC(15,2) DEFAULT 4400000,  -- 4.4 triệu/người phụ thuộc
    is_active               BOOLEAN DEFAULT TRUE,
    created_at              TIMESTAMP DEFAULT NOW()
);

CREATE TABLE employee_allowances (
    id              BIGSERIAL PRIMARY KEY,
    employee_id     BIGINT NOT NULL REFERENCES employees(id),
    allowance_type  VARCHAR(50),                    -- MEAL|TRANSPORT|PHONE|HOUSING|RESPONSIBILITY
    amount          NUMERIC(15,2) NOT NULL,
    is_taxable      BOOLEAN DEFAULT FALSE,
    effective_date  DATE,
    end_date        DATE
);

-- ─── ATTENDANCE ──────────────────────────────

CREATE TABLE attendance_logs (
    id              BIGSERIAL PRIMARY KEY,
    employee_id     BIGINT NOT NULL REFERENCES employees(id),
    work_date       DATE NOT NULL,
    check_in        TIMESTAMP,
    check_out       TIMESTAMP,
    check_in_ip     VARCHAR(45),
    check_in_location VARCHAR(200),
    status          VARCHAR(20),                    -- ON_TIME|LATE|EARLY_LEAVE|ABSENT|HOLIDAY|LEAVE
    note            TEXT,
    approved_by     BIGINT REFERENCES employees(id),
    UNIQUE(employee_id, work_date)
);

CREATE TABLE attendance_summary (
    id              BIGSERIAL PRIMARY KEY,
    employee_id     BIGINT NOT NULL REFERENCES employees(id),
    year            INT NOT NULL,
    month           INT NOT NULL,
    work_days       DECIMAL(5,1) DEFAULT 0,         -- số công chuẩn
    actual_days     DECIMAL(5,1) DEFAULT 0,         -- số công thực tế
    late_count      INT DEFAULT 0,
    absent_count    INT DEFAULT 0,
    overtime_hours  DECIMAL(6,2) DEFAULT 0,
    UNIQUE(employee_id, year, month)
);

-- ─── LEAVE ───────────────────────────────────

CREATE TABLE leave_types (
    id              BIGSERIAL PRIMARY KEY,
    code            VARCHAR(30) UNIQUE NOT NULL,    -- ANNUAL|SICK|UNPAID|MATERNITY|PATERNITY|BEREAVEMENT
    name            VARCHAR(100) NOT NULL,
    days_per_year   DECIMAL(5,1),                   -- null = unlimited (unpaid)
    is_paid         BOOLEAN DEFAULT TRUE,
    requires_approval BOOLEAN DEFAULT TRUE,
    carry_over_days DECIMAL(5,1) DEFAULT 0,
    description     TEXT
);

CREATE TABLE leave_balances (
    id              BIGSERIAL PRIMARY KEY,
    employee_id     BIGINT NOT NULL REFERENCES employees(id),
    leave_type_id   BIGINT NOT NULL REFERENCES leave_types(id),
    year            INT NOT NULL,
    total_days      DECIMAL(5,1) DEFAULT 0,
    used_days       DECIMAL(5,1) DEFAULT 0,
    pending_days    DECIMAL(5,1) DEFAULT 0,
    remaining_days  DECIMAL(5,1) GENERATED ALWAYS AS (total_days - used_days - pending_days) STORED,
    UNIQUE(employee_id, leave_type_id, year)
);

CREATE TABLE leave_requests (
    id              BIGSERIAL PRIMARY KEY,
    employee_id     BIGINT NOT NULL REFERENCES employees(id),
    leave_type_id   BIGINT NOT NULL REFERENCES leave_types(id),
    start_date      DATE NOT NULL,
    end_date        DATE NOT NULL,
    total_days      DECIMAL(5,1) NOT NULL,
    reason          TEXT,
    status          VARCHAR(20) DEFAULT 'PENDING',  -- PENDING|APPROVED|REJECTED|CANCELLED
    manager_id      BIGINT REFERENCES employees(id),
    manager_note    TEXT,
    reviewed_at     TIMESTAMP,
    hr_override_by  BIGINT REFERENCES employees(id),
    attachment_url  TEXT,
    created_at      TIMESTAMP DEFAULT NOW(),
    updated_at      TIMESTAMP DEFAULT NOW()
);

-- ─── PAYROLL ─────────────────────────────────

CREATE TABLE payroll_runs (
    id              BIGSERIAL PRIMARY KEY,
    year            INT NOT NULL,
    month           INT NOT NULL,
    status          VARCHAR(20) DEFAULT 'DRAFT',    -- DRAFT|PROCESSING|COMPLETED|PUBLISHED
    run_by          BIGINT REFERENCES employees(id),
    run_at          TIMESTAMP,
    published_at    TIMESTAMP,
    notes           TEXT,
    UNIQUE(year, month)
);

CREATE TABLE payslips (
    id                  BIGSERIAL PRIMARY KEY,
    payroll_run_id      BIGINT NOT NULL REFERENCES payroll_runs(id),
    employee_id         BIGINT NOT NULL REFERENCES employees(id),
    base_salary         NUMERIC(15,2) DEFAULT 0,
    total_allowances    NUMERIC(15,2) DEFAULT 0,
    gross_salary        NUMERIC(15,2) DEFAULT 0,    -- base + allowances
    social_insurance    NUMERIC(15,2) DEFAULT 0,    -- 8%
    health_insurance    NUMERIC(15,2) DEFAULT 0,    -- 1.5%
    unemployment        NUMERIC(15,2) DEFAULT 0,    -- 1%
    taxable_income      NUMERIC(15,2) DEFAULT 0,
    personal_income_tax NUMERIC(15,2) DEFAULT 0,
    other_deductions    NUMERIC(15,2) DEFAULT 0,
    net_salary          NUMERIC(15,2) DEFAULT 0,
    actual_work_days    DECIMAL(5,1),
    standard_work_days  DECIMAL(5,1),
    pdf_url             TEXT,                       -- MinIO object key
    UNIQUE(payroll_run_id, employee_id)
);

-- ─── PERFORMANCE ─────────────────────────────

CREATE TABLE review_cycles (
    id              BIGSERIAL PRIMARY KEY,
    name            VARCHAR(200) NOT NULL,           -- Q1 2024, Annual 2024
    cycle_type      VARCHAR(20),                    -- QUARTERLY|SEMI_ANNUAL|ANNUAL
    start_date      DATE,
    end_date        DATE,
    status          VARCHAR(20) DEFAULT 'DRAFT',    -- DRAFT|ACTIVE|COMPLETED
    created_at      TIMESTAMP DEFAULT NOW()
);

CREATE TABLE performance_reviews (
    id              BIGSERIAL PRIMARY KEY,
    cycle_id        BIGINT NOT NULL REFERENCES review_cycles(id),
    employee_id     BIGINT NOT NULL REFERENCES employees(id),
    reviewer_id     BIGINT NOT NULL REFERENCES employees(id),
    self_score      DECIMAL(4,2),                   -- 1.0 – 5.0
    reviewer_score  DECIMAL(4,2),
    final_score     DECIMAL(4,2),
    rating          VARCHAR(20),                    -- EXCELLENT|GOOD|MEETS|BELOW|POOR
    strengths       TEXT,
    improvements    TEXT,
    goals_next      TEXT,
    status          VARCHAR(20) DEFAULT 'PENDING',
    completed_at    TIMESTAMP,
    UNIQUE(cycle_id, employee_id, reviewer_id)
);

CREATE TABLE kpi_records (
    id              BIGSERIAL PRIMARY KEY,
    review_id       BIGINT NOT NULL REFERENCES performance_reviews(id),
    kpi_name        VARCHAR(200) NOT NULL,
    weight          DECIMAL(5,2),                   -- % trọng số
    target          TEXT,
    actual          TEXT,
    score           DECIMAL(4,2)
);

-- ─── RECRUITMENT ─────────────────────────────

CREATE TABLE job_postings (
    id              BIGSERIAL PRIMARY KEY,
    title           VARCHAR(200) NOT NULL,
    department_id   BIGINT REFERENCES departments(id),
    position_id     BIGINT REFERENCES positions(id),
    description     TEXT,
    requirements    TEXT,
    salary_range    VARCHAR(100),
    headcount       INT DEFAULT 1,
    posting_date    DATE,
    closing_date    DATE,
    status          VARCHAR(20) DEFAULT 'OPEN',     -- OPEN|CLOSED|PAUSED|FILLED
    created_by      BIGINT REFERENCES employees(id),
    created_at      TIMESTAMP DEFAULT NOW()
);

CREATE TABLE applications (
    id              BIGSERIAL PRIMARY KEY,
    job_posting_id  BIGINT NOT NULL REFERENCES job_postings(id),
    candidate_name  VARCHAR(200) NOT NULL,
    candidate_email VARCHAR(150),
    candidate_phone VARCHAR(20),
    cv_url          TEXT,
    cover_letter    TEXT,
    source          VARCHAR(50),                    -- LINKEDIN|INDEED|REFERRAL|WEBSITE
    stage           VARCHAR(30) DEFAULT 'NEW',      -- NEW|SCREENING|INTERVIEW|OFFER|HIRED|REJECTED
    rejected_reason TEXT,
    applied_at      TIMESTAMP DEFAULT NOW(),
    updated_at      TIMESTAMP DEFAULT NOW()
);

CREATE TABLE interviews (
    id              BIGSERIAL PRIMARY KEY,
    application_id  BIGINT NOT NULL REFERENCES applications(id),
    round           INT DEFAULT 1,                  -- Vòng phỏng vấn
    interview_type  VARCHAR(20),                    -- PHONE|ONLINE|ONSITE|TECHNICAL
    scheduled_at    TIMESTAMP,
    duration_minutes INT DEFAULT 60,
    location        VARCHAR(200),
    meeting_url     TEXT,
    interviewers    TEXT,                           -- JSON array of employee ids
    result          VARCHAR(20),                    -- PASSED|FAILED|NO_SHOW|RESCHEDULED
    feedback        TEXT,
    created_at      TIMESTAMP DEFAULT NOW()
);

-- ─── NOTIFICATIONS ───────────────────────────

CREATE TABLE notifications (
    id              BIGSERIAL PRIMARY KEY,
    recipient_id    BIGINT NOT NULL REFERENCES employees(id),
    type            VARCHAR(50),                    -- LEAVE_APPROVED|PAYSLIP_READY|REVIEW_DUE|...
    title           VARCHAR(200),
    message         TEXT,
    is_read         BOOLEAN DEFAULT FALSE,
    related_url     VARCHAR(200),
    created_at      TIMESTAMP DEFAULT NOW()
);

-- ─── INDEXES ─────────────────────────────────

CREATE INDEX idx_emp_dept         ON employees(department_id);
CREATE INDEX idx_emp_status       ON employees(status);
CREATE INDEX idx_emp_manager      ON employees(manager_id);
CREATE INDEX idx_attendance_date  ON attendance_logs(employee_id, work_date);
CREATE INDEX idx_leave_req_emp    ON leave_requests(employee_id, status);
CREATE INDEX idx_leave_req_mgr    ON leave_requests(manager_id, status);
CREATE INDEX idx_payslip_run      ON payslips(payroll_run_id);
CREATE INDEX idx_payslip_emp      ON payslips(employee_id);
CREATE INDEX idx_application_job  ON applications(job_posting_id, stage);
CREATE INDEX idx_notif_recipient  ON notifications(recipient_id, is_read);

-- ─── SEED DATA ───────────────────────────────

INSERT INTO roles (name) VALUES
('SUPER_ADMIN'), ('HR_ADMIN'), ('HR_STAFF'), ('MANAGER'), ('EMPLOYEE'), ('RECRUITER');

INSERT INTO leave_types (code, name, days_per_year, is_paid, requires_approval) VALUES
('ANNUAL',      'Nghỉ phép năm',        12,   TRUE,  TRUE),
('SICK',        'Nghỉ bệnh',            30,   TRUE,  TRUE),
('UNPAID',      'Nghỉ không lương',     NULL, FALSE, TRUE),
('MATERNITY',   'Nghỉ thai sản',        180,  TRUE,  TRUE),
('PATERNITY',   'Nghỉ thai sản (cha)',  5,    TRUE,  TRUE),
('BEREAVEMENT', 'Nghỉ tang',            3,    TRUE,  TRUE),
('MARRIAGE',    'Nghỉ kết hôn',         3,    TRUE,  TRUE);

INSERT INTO salary_configs (effective_date, min_wage, social_insurance_rate,
    health_insurance_rate, unemployment_rate, personal_deduction, dependent_deduction)
VALUES ('2024-01-01', 4680000, 8.00, 1.50, 1.00, 11000000, 4400000);

INSERT INTO departments (code, name) VALUES
('DEP-EXEC', 'Ban Giám đốc'),
('DEP-HR',   'Phòng Nhân sự'),
('DEP-TECH', 'Phòng Công nghệ'),
('DEP-FIN',  'Phòng Tài chính'),
('DEP-MKT',  'Phòng Marketing'),
('DEP-SALE', 'Phòng Kinh doanh');

INSERT INTO positions (code, name, level) VALUES
('POS-CEO',    'Giám đốc điều hành',    'DIRECTOR'),
('POS-HR-MGR', 'Trưởng phòng Nhân sự', 'MANAGER'),
('POS-DEV-SR', 'Senior Developer',     'SENIOR'),
('POS-DEV-MD', 'Mid Developer',        'MIDDLE'),
('POS-DEV-JR', 'Junior Developer',     'JUNIOR');