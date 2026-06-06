# HRMPro — API Specification

Base URL: `/api/v1`
Auth: `Authorization: Bearer <access_token>` (tất cả endpoint trừ `/auth/**`)

---

## Auth

### POST `/auth/login`

```json
Request:  { "username": "string", "password": "string" }
Response: {
  "accessToken": "string",
  "refreshToken": "string",
  "tokenType": "Bearer",
  "expiresIn": 900,
  "user": { "id": 1, "username": "string", "roles": ["EMPLOYEE"], "employeeId": 1 }
}
```

### POST `/auth/refresh`

```json
Request:  { "refreshToken": "string" }
Response: { "accessToken": "string", "expiresIn": 900 }
```

### POST `/auth/logout`

```
Xóa refresh token khỏi Redis
Response: 200 OK
```

### POST `/auth/change-password`

```json
Request:  { "currentPassword": "string", "newPassword": "string" }
Response: { "success": true, "message": "Password changed" }
```

---

## Employees `/employees`

### GET `/employees`

**Role**: HR_ADMIN, HR_STAFF, MANAGER
**Query params**: `page`, `size`, `sort`, `departmentId`, `status`, `search` (name/code/email)

```json
Response: {
  "content": [
    {
      "id": 1, "employeeCode": "EMP-0001",
      "fullName": "Nguyễn Văn A",
      "email": "a@company.com",
      "phone": "0901234567",
      "department": { "id": 1, "name": "Phòng Công nghệ" },
      "position": { "id": 2, "name": "Senior Developer" },
      "status": "ACTIVE",
      "hireDate": "2022-01-15",
      "avatarUrl": "string"
    }
  ],
  "page": 0, "size": 20, "totalElements": 150, "totalPages": 8
}
```

### POST `/employees`

**Role**: HR_ADMIN

```json
Request: {
  "firstName": "string", "lastName": "string",
  "email": "string", "phone": "string",
  "dateOfBirth": "1990-05-20", "gender": "MALE",
  "idCardNumber": "string", "hireDate": "2024-01-01",
  "departmentId": 1, "positionId": 2, "managerId": 5,
  "baseSalary": 20000000,
  "contractType": "FIXED_TERM_1Y"
}
Response: { "success": true, "data": { ...employeeResponse } }
```

### GET `/employees/{id}`

**Role**: HR, MANAGER (own team), EMPLOYEE (self only)

```json
Response: {
  ...all fields,
  "contract": { "contractNumber": "HD-001", "baseSalary": 20000000, ... },
  "leaveBalance": [
    { "leaveType": "Nghỉ phép năm", "totalDays": 12, "usedDays": 3, "remaining": 9 }
  ],
  "manager": { "id": 5, "fullName": "Trần Thị B" }
}
```

### PUT `/employees/{id}`

**Role**: HR_ADMIN (tất cả fields), EMPLOYEE (limited: phone, currentAddress, bankAccount)

### DELETE `/employees/{id}`

**Role**: HR_ADMIN → soft delete (status = TERMINATED, terminationDate = today)

### POST `/employees/{id}/avatar`

**Role**: HR_ADMIN, self
Content-Type: multipart/form-data, field: `file`

### GET `/employees/{id}/documents`

**Role**: HR, self — trả về list contract PDFs, ID card scans, ...

---

## Organization `/departments`, `/positions`

### GET `/departments/tree`

**Role**: ALL

```json
Response: [
  {
    "id": 1, "code": "DEP-TECH", "name": "Phòng Công nghệ",
    "manager": { "id": 5, "fullName": "..." },
    "headcount": 12,
    "children": [
      { "id": 4, "name": "Team Backend", "children": [] }
    ]
  }
]
```

### GET `/departments/{id}/employees`

**Role**: HR, MANAGER (own dept only)

### POST `/departments` / PUT `/departments/{id}` / DELETE `/departments/{id}`

**Role**: HR_ADMIN

### GET `/positions` | POST `/positions` | PUT `/positions/{id}`

**Role**: HR_ADMIN

---

## Attendance `/attendance`

### POST `/attendance/checkin`

**Role**: EMPLOYEE

```json
Request:  { "location": "Office HCM", "note": "optional" }
Response: { "checkIn": "2024-03-15T08:05:00", "status": "ON_TIME" }
```

### POST `/attendance/checkout`

**Role**: EMPLOYEE

```json
Response: { "checkOut": "2024-03-15T17:35:00", "workHours": 9.5 }
```

### GET `/attendance/me`

**Query**: `month=3&year=2024`

```json
Response: [
  { "workDate": "2024-03-15", "checkIn": "08:05", "checkOut": "17:35",
    "status": "ON_TIME", "workHours": 9.5 }
]
```

### GET `/attendance/team`

**Role**: MANAGER, HR — xem attendance của team/all
**Query**: `month`, `year`, `departmentId`, `employeeId`

### GET `/attendance/summary`

**Role**: HR_ADMIN
**Query**: `month`, `year`, `departmentId`

```json
Response: [
  { "employee": {...}, "workDays": 22, "actualDays": 21.5,
    "lateCount": 1, "absentCount": 0, "overtimeHours": 4 }
]
```

### POST `/attendance/adjust`

**Role**: HR_ADMIN — điều chỉnh chấm công thủ công

```json
Request: { "employeeId": 1, "workDate": "2024-03-15",
           "checkIn": "08:00", "checkOut": "18:00", "reason": "string" }
```

### GET `/attendance/export`

**Role**: HR_ADMIN — xuất Excel
**Query**: `month`, `year`, `departmentId`
Response: file `.xlsx`

---

## Leave `/leaves`

### GET `/leaves/types`

**Role**: ALL — danh sách loại nghỉ

### GET `/leaves/balance/me`

**Role**: EMPLOYEE — số ngày phép còn lại theo loại

### GET `/leaves/me`

**Role**: EMPLOYEE
**Query**: `year`, `status`

### POST `/leaves`

**Role**: EMPLOYEE

```json
Request: {
  "leaveTypeId": 1,
  "startDate": "2024-03-20",
  "endDate": "2024-03-22",
  "totalDays": 3,
  "reason": "Du lịch gia đình"
}
Response: { "id": 10, "status": "PENDING", ... }
```

### PATCH `/leaves/{id}/cancel`

**Role**: EMPLOYEE (chỉ cancel PENDING của bản thân)

### GET `/leaves/pending`

**Role**: MANAGER, HR_ADMIN — xem đơn chờ duyệt

### PATCH `/leaves/{id}/approve`

**Role**: MANAGER (team của mình), HR_ADMIN

```json
Request:  { "approved": true, "note": "optional" }
Response: { "status": "APPROVED", ... }
```

### GET `/leaves/report`

**Role**: HR_ADMIN
**Query**: `year`, `departmentId` — báo cáo nghỉ phép toàn công ty

---

## Payroll `/payroll`

### GET `/payroll/payslip/me`

**Role**: EMPLOYEE
**Query**: `month`, `year`

```json
Response: {
  "month": 3, "year": 2024,
  "baseSalary": 20000000,
  "allowances": { "meal": 730000, "transport": 500000 },
  "grossSalary": 21230000,
  "deductions": {
    "socialInsurance": 1600000,
    "healthInsurance": 300000,
    "unemployment": 200000,
    "personalIncomeTax": 450000
  },
  "netSalary": 18680000,
  "actualWorkDays": 22, "standardWorkDays": 22,
  "pdfUrl": "string"
}
```

### GET `/payroll/runs`

**Role**: HR_ADMIN — lịch sử các lần chạy lương

### POST `/payroll/runs`

**Role**: HR_ADMIN — tạo payroll run mới

```json
Request:  { "month": 3, "year": 2024 }
Response: { "id": 5, "status": "PROCESSING", ... }
```

### POST `/payroll/runs/{id}/calculate`

**Role**: HR_ADMIN — trigger tính lương (async, dùng status polling)

### POST `/payroll/runs/{id}/publish`

**Role**: HR_ADMIN — publish → nhân viên xem được payslip + email notify

### GET `/payroll/runs/{id}/payslips`

**Role**: HR_ADMIN — xem tất cả payslip của run đó

### GET `/payroll/runs/{id}/export`

**Role**: HR_ADMIN — xuất Excel bảng lương

---

## Performance `/performance`

### GET `/performance/cycles`

### POST `/performance/cycles` **[HR_ADMIN]**

### PATCH `/performance/cycles/{id}/activate` **[HR_ADMIN]**

### GET `/performance/reviews/me`

**Role**: EMPLOYEE — xem review của bản thân

### GET `/performance/reviews/pending`

**Role**: MANAGER — xem review cần điền

### PUT `/performance/reviews/{id}`

```json
Request: {
  "selfScore": 4.2,
  "reviewerScore": 3.8,
  "strengths": "string",
  "improvements": "string",
  "goalsNext": "string",
  "kpis": [
    { "kpiName": "Delivery on time", "weight": 30, "target": "95%", "actual": "97%", "score": 5 }
  ]
}
```

---

## Recruitment `/recruitment`

### GET `/recruitment/jobs`

### POST `/recruitment/jobs` **[HR_ADMIN, RECRUITER]**

### PATCH `/recruitment/jobs/{id}/status` **[HR_ADMIN, RECRUITER]**

### GET `/recruitment/jobs/{id}/applications`

**Role**: HR_ADMIN, RECRUITER

### POST `/recruitment/jobs/{id}/applications`

Public endpoint (không cần auth) — nộp CV

```json
Request: multipart/form-data
  - candidateName, candidateEmail, candidatePhone
  - source
  - cvFile (file)
  - coverLetter
```

### PATCH `/recruitment/applications/{id}/stage`

**Role**: RECRUITER, HR_ADMIN

```json
Request: { "stage": "INTERVIEW", "note": "optional" }
```

### POST `/recruitment/applications/{id}/interviews`

**Role**: RECRUITER

```json
Request: {
  "round": 1, "interviewType": "TECHNICAL",
  "scheduledAt": "2024-03-25T14:00:00",
  "durationMinutes": 60,
  "interviewers": [3, 5],
  "meetingUrl": "https://meet.google.com/xxx"
}
```

---

## Reports `/reports`

### GET `/reports/headcount` **[HR_ADMIN]**

```json
Response: {
  "total": 150, "active": 142, "onLeave": 5, "terminated": 3,
  "byDepartment": [...], "byPosition": [...], "newHiresThisMonth": 3, "turnoverRate": 2.1
}
```

### GET `/reports/attendance/summary` **[HR_ADMIN]**

### GET `/reports/attendance/export` **[HR_ADMIN]** → Excel

### GET `/reports/leave/summary` **[HR_ADMIN]**

### GET `/reports/payroll/summary` **[HR_ADMIN]**

---

## Notifications `/notifications`

### GET `/notifications/me` — danh sách thông báo của tôi

### PATCH `/notifications/{id}/read`

### PATCH `/notifications/read-all`

### GET `/notifications/me/unread-count` → `{ "count": 3 }`
