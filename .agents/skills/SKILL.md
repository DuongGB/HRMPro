---
name: hrm-web
description: >
  Full-stack skill for building a Human Resource Management (HRM) web application
  with Spring Boot 3 (backend) and React 18 + TypeScript (frontend). Use this
  skill whenever the user wants to scaffold, extend, or debug any part of an HRM
  platform — including employee management, department/org chart, attendance &
  timekeeping, leave requests, payroll, performance review, recruitment pipeline,
  onboarding, role-based access control, or HR analytics dashboard. Trigger even
  if the user mentions "nhân sự", "HRM", "HRMS", "employee", "payroll",
  "attendance", "leave request", "performance review", "recruitment", "org chart",
  "timekeeping", or asks to "add/fix/extend" any HR feature.
---

# HRM Web — Agent Skill

## Project Overview

**HRMPro** — Hệ thống quản lý nhân sự toàn diện cho doanh nghiệp vừa và lớn, gồm các module:

| Module           | Tính năng chính                                      |
| ---------------- | ---------------------------------------------------- |
| **Employee**     | Hồ sơ nhân viên, hợp đồng, giấy tờ, lịch sử làm việc |
| **Organization** | Phòng ban, chức vụ, org chart phân cấp               |
| **Attendance**   | Chấm công (check-in/out), tích hợp máy chấm công     |
| **Leave**        | Đơn xin nghỉ, phê duyệt, số ngày phép theo loại      |
| **Payroll**      | Tính lương, phụ cấp, khấu trừ, bảng lương            |
| **Performance**  | KPI, đánh giá định kỳ, review 360°                   |
| **Recruitment**  | Đăng tuyển, pipeline ứng viên, phỏng vấn             |
| **Onboarding**   | Checklist nhân viên mới, bàn giao thiết bị           |
| **Reports**      | Dashboard HR analytics, xuất báo cáo Excel/PDF       |
| **Auth & RBAC**  | Phân quyền theo role: HR Admin, Manager, Employee    |

---

## Tech Stack

| Layer     | Technology                                             |
| --------- | ------------------------------------------------------ |
| Backend   | Spring Boot 3.x, Spring Security 6, Spring Data JPA    |
| Database  | PostgreSQL 16 (prod), H2 (test)                        |
| Cache     | Redis 7 (session, attendance cache)                    |
| Storage   | MinIO / AWS S3 (avatar, documents, payslip PDF)        |
| Email     | Spring Mail + Thymeleaf templates                      |
| Scheduler | Spring `@Scheduled` (payroll cron, attendance summary) |
| Frontend  | React 18 + TypeScript, Vite                            |
| UI        | Ant Design 5 (tables, forms, calendar) + Tailwind CSS  |
| State     | Zustand (global) + TanStack Query v5 (server state)    |
| Charts    | Recharts (analytics dashboard)                         |
| Auth      | JWT access token (15m) + refresh token (7d)            |
| Export    | Apache POI (Excel), iText / JasperReports (PDF)        |
| Deploy    | Docker Compose (dev)                                   |

---

## System Architecture

```
┌───────────────────────────────────────────────────┐
│                React 18 + TypeScript               │
│   Ant Design │ Zustand │ TanStack Query │ Recharts │
└──────────────────────┬────────────────────────────┘
                       │ REST API (JSON)
                       │ JWT Bearer Token
┌──────────────────────▼────────────────────────────┐
│              Spring Boot 3 API Gateway             │
│                                                    │
│  ┌──────────┐ ┌──────────┐ ┌──────────────────┐   │
│  │   Auth   │ │ Employee │ │   Attendance     │   │
│  │ /api/auth│ │ /api/emp │ │ /api/attendance  │   │
│  └──────────┘ └──────────┘ └──────────────────┘   │
│  ┌──────────┐ ┌──────────┐ ┌──────────────────┐   │
│  │  Leave   │ │ Payroll  │ │  Performance     │   │
│  └──────────┘ └──────────┘ └──────────────────┘   │
│  ┌──────────┐ ┌──────────┐ ┌──────────────────┐   │
│  │ Recruit  │ │ Reports  │ │  Notification    │   │
│  └──────────┘ └──────────┘ └──────────────────┘   │
└───────┬────────────┬───────────────┬───────────────┘
        │            │               │
   PostgreSQL      Redis         MinIO/S3
```

---

## Directory Structure

### Backend (`/backend/src/main/java/com/hrmpro/`)

```
├── config/
│   ├── SecurityConfig.java
│   ├── JwtConfig.java
│   ├── RedisConfig.java
│   ├── MinioConfig.java
│   └── SchedulerConfig.java
├── module/
│   ├── auth/
│   │   ├── controller/AuthController.java
│   │   ├── service/AuthService.java
│   │   ├── dto/LoginRequest.java, TokenResponse.java
│   │   └── security/ (JwtProvider, JwtFilter, UserDetailsServiceImpl)
│   ├── employee/
│   │   ├── controller/EmployeeController.java
│   │   ├── service/EmployeeService.java
│   │   ├── repository/EmployeeRepository.java
│   │   ├── entity/Employee.java, Contract.java
│   │   └── dto/
│   ├── organization/
│   │   ├── entity/Department.java, Position.java
│   │   └── ...
│   ├── attendance/
│   │   ├── entity/AttendanceLog.java, AttendanceSummary.java
│   │   └── ...
│   ├── leave/
│   │   ├── entity/LeaveRequest.java, LeaveBalance.java, LeaveType.java
│   │   └── ...
│   ├── payroll/
│   │   ├── entity/PayrollRun.java, Payslip.java, SalaryConfig.java
│   │   ├── service/PayrollCalculationService.java
│   │   └── ...
│   ├── performance/
│   │   ├── entity/ReviewCycle.java, PerformanceReview.java, KpiRecord.java
│   │   └── ...
│   ├── recruitment/
│   │   ├── entity/JobPosting.java, Application.java, Interview.java
│   │   └── ...
│   └── report/
│       ├── service/ExcelExportService.java
│       └── service/PdfExportService.java
├── common/
│   ├── dto/ApiResponse.java, PageResponse.java
│   ├── exception/GlobalExceptionHandler.java
│   ├── audit/AuditableEntity.java          ← createdAt, updatedAt, createdBy
│   └── util/DateUtil.java
```

### Frontend (`/frontend/src/`)

```
├── api/              ← axios instance + per-module hooks
│   ├── client.ts     ← axios + JWT interceptor + refresh logic
│   ├── employee.ts
│   ├── attendance.ts
│   ├── leave.ts
│   ├── payroll.ts
│   └── ...
├── components/
│   ├── common/       ← PageHeader, StatusBadge, ConfirmModal, FileUpload
│   ├── org/          ← OrgChart (tree), DepartmentCard
│   ├── attendance/   ← AttendanceCalendar, CheckInButton
│   ├── leave/        ← LeaveRequestForm, ApprovalTimeline
│   └── payroll/      ← PayslipCard, PayrollTable
├── pages/
│   ├── Dashboard/    ← HR Analytics overview
│   ├── Employees/    ← List, Detail, Create, Edit
│   ├── Organization/ ← Departments, Positions, OrgChart
│   ├── Attendance/   ← My attendance, Team attendance (manager)
│   ├── Leave/        ← My leaves, Team approval (manager)
│   ├── Payroll/      ← Payslip view (employee), Run payroll (HR)
│   ├── Performance/  ← KPI, Review cycles
│   ├── Recruitment/  ← Job postings, Kanban pipeline
│   └── Settings/     ← Company, Roles, Leave types, Salary config
├── store/
│   ├── authStore.ts  ← user info, token, role
│   └── uiStore.ts    ← sidebar collapsed, theme
├── hooks/
│   ├── useAuth.ts
│   ├── usePermission.ts   ← can('employee:create') etc.
│   └── usePagination.ts
├── types/
│   ├── employee.ts
│   ├── attendance.ts
│   ├── leave.ts
│   ├── payroll.ts
│   └── common.ts
└── utils/
    ├── permission.ts  ← RBAC helper
    ├── formatter.ts   ← currency (VND), date, phone
    └── constants.ts
```

---

## Core Domain Models

### Employee Entity

```java
@Entity @Table(name = "employees")
public class Employee extends AuditableEntity {
    @Id @GeneratedValue private Long id;
    private String employeeCode;       // EMP-0001
    private String firstName;
    private String lastName;
    private String email;
    private String phone;
    private LocalDate dateOfBirth;
    private String gender;             // MALE | FEMALE | OTHER
    private String avatarUrl;
    private LocalDate hireDate;
    private LocalDate terminationDate;
    private EmployeeStatus status;     // ACTIVE | ON_LEAVE | TERMINATED | PROBATION

    @ManyToOne Department department;
    @ManyToOne Position position;
    @ManyToOne(fetch = LAZY) Employee manager;  // direct manager
    @OneToOne(mappedBy = "employee") User user; // login account
}
```

### RBAC — Roles & Permissions

```
SUPER_ADMIN   → tất cả quyền
HR_ADMIN      → quản lý toàn bộ nhân viên, phê duyệt, chạy lương
HR_STAFF      → xem và cập nhật hồ sơ, không chạy lương
MANAGER       → xem team của mình, duyệt leave, xem attendance team
EMPLOYEE      → xem hồ sơ bản thân, xin nghỉ, xem payslip
RECRUITER     → quản lý job posting, pipeline ứng viên
```

### Leave Request Flow

```
EMPLOYEE tạo đơn (PENDING)
    → MANAGER review → APPROVED / REJECTED
    → HR_ADMIN override nếu cần
    → Nếu APPROVED: LeaveBalance bị trừ ngày phép
    → Notify qua email (Spring Mail)
```

### Payroll Calculation

```java
// PayrollCalculationService
grossSalary   = baseSalary + allowances (meal, transport, phone, ...)
taxableIncome = grossSalary - socialInsurance - healthInsurance - unemployment
personalIncomeTax = calculatePIT(taxableIncome)  // thuế TNCN lũy tiến VN
netSalary     = grossSalary - socialInsurance - healthInsurance
                           - unemployment - personalIncomeTax - deductions
```

---

## API Endpoints Summary

> Xem chi tiết đầy đủ tại `references/api-spec.md`

| Method | Path                             | Role              | Mô tả                          |
| ------ | -------------------------------- | ----------------- | ------------------------------ |
| POST   | `/api/auth/login`                | ALL               | Đăng nhập                      |
| POST   | `/api/auth/refresh`              | ALL               | Refresh JWT                    |
| GET    | `/api/employees`                 | HR, MANAGER       | Danh sách nhân viên (pageable) |
| POST   | `/api/employees`                 | HR_ADMIN          | Thêm nhân viên                 |
| GET    | `/api/employees/{id}`            | HR, MANAGER, self | Chi tiết                       |
| GET    | `/api/departments/tree`          | ALL               | Org chart dạng cây             |
| GET    | `/api/attendance/me`             | EMPLOYEE          | Lịch sử chấm công bản thân     |
| POST   | `/api/attendance/checkin`        | EMPLOYEE          | Check-in                       |
| POST   | `/api/attendance/checkout`       | EMPLOYEE          | Check-out                      |
| GET    | `/api/leaves/me`                 | EMPLOYEE          | Đơn nghỉ của tôi               |
| POST   | `/api/leaves`                    | EMPLOYEE          | Tạo đơn xin nghỉ               |
| PATCH  | `/api/leaves/{id}/approve`       | MANAGER, HR       | Phê duyệt                      |
| GET    | `/api/payroll/payslip/me`        | EMPLOYEE          | Xem payslip                    |
| POST   | `/api/payroll/run`               | HR_ADMIN          | Chạy lương tháng               |
| GET    | `/api/reports/headcount`         | HR_ADMIN          | Báo cáo đầu người              |
| GET    | `/api/reports/attendance/export` | HR_ADMIN          | Xuất Excel chấm công           |

---

## Coding Conventions

### Backend

- **Package by module** (không phải by layer): `module/employee/controller`, `module/leave/service`, ...
- Mọi response đều wrap: `ApiResponse<T>` với `{ success, message, data, timestamp }`
- Pagination: `PageResponse<T>` với `{ content, page, size, totalElements, totalPages }`
- Validation: `@Valid` + custom validator khi cần
- Exception: custom exceptions (`EmployeeNotFoundException`, `LeaveBalanceInsufficientException`...) → `GlobalExceptionHandler`
- Audit: tất cả entity extends `AuditableEntity` (`@CreatedDate`, `@LastModifiedDate`, `@CreatedBy`)
- Security: dùng `@PreAuthorize("hasRole('HR_ADMIN')")` tại Controller method
- Test: Service unit test (Mockito) + `@WebMvcTest` cho Controller

### Frontend

- **Tất cả số tiền** format VND: `Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' })`
- **Tất cả ngày** format `DD/MM/YYYY` (Việt Nam)
- Permission guard: `usePermission()` hook kiểm tra trước khi render button/route
- Ant Design Table: luôn dùng `rowKey="id"`, `pagination={{ pageSize: 20 }}`
- Loading state: Ant Design `Skeleton` hoặc `Spin` — không để màn hình trắng
- Error: hiển thị qua `notification.error()` của Ant Design

---

## When Implementing a Feature

1. **Xác định module** → đọc `references/api-spec.md` nếu cần chi tiết endpoint
2. **Backend order**: Entity → Repository → Service (+test) → Controller → DTO mapping
3. **Frontend order**: `types/` → API hook (`useQuery`/`useMutation`) → Component → Page → Route
4. **RBAC**: luôn gắn `@PreAuthorize` + FE permission check song song
5. **Notify**: nếu có approval flow → gửi email qua `NotificationService`
6. **Export**: nếu cần Excel/PDF → `references/export-guide.md`

---

## Reference Files

| File                                | Đọc khi nào                                     |
| ----------------------------------- | ----------------------------------------------- |
| `references/agent-system-prompt.md` | System prompt đầy đủ cho AI coding agent        |
| `references/db-schema.sql`          | PostgreSQL schema đầy đủ tất cả bảng            |
| `references/api-spec.md`            | API spec chi tiết request/response mỗi endpoint |
| `references/docker-compose.yml`     | Dev environment setup                           |
