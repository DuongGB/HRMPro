# HRMPro - Hệ Thống Quản Trị Nhân Sự Doanh Nghiệp Toàn Diện

HRMPro là một hệ thống quản trị nhân sự (Human Resource Management) chuẩn doanh nghiệp, được xây dựng trên kiến trúc hiện đại, có tính mở rộng cao và khả năng xử lý thời gian thực (real-time). Hệ thống cung cấp giải pháp toàn diện từ tuyển dụng, quản lý hồ sơ nhân sự, chấm công, tính lương, quản lý phép, đến đánh giá hiệu suất làm việc.

---

## 🚀 Tính Năng Chính

### 1. Quản Trị Nhân Sự & Tổ Chức (Employee & Organization)
*   **Hồ sơ nhân viên**: Quản lý thông tin chi tiết nhân viên, hợp đồng lao động, lịch sử công tác.
*   **Cơ cấu tổ chức**: Quản lý phòng ban, sơ đồ tổ chức, chức vụ và phân quyền theo phòng ban.
*   **Milestone Automation**: Tự động hóa các mốc sự kiện quan trọng của nhân viên (thử việc, sinh nhật, thâm niên).

### 2. Chấm Công & Nghỉ Phép (Attendance & Leave Management)
*   **Chấm công đa hình thức**: Theo dõi thời gian ra/vào (Check-in/Check-out), tính toán giờ công làm việc thực tế.
*   **Yêu cầu nghỉ phép**: Quy trình duyệt đơn xin nghỉ phép, kiểm soát giới hạn phép năm (mặc định 16 ngày/năm).
*   **Quản lý ca làm việc**: Phân ca làm việc linh hoạt, tăng ca (OT).

### 3. Quản Lý Tuyển Dụng (Recruitment System)
*   **Chiến dịch tuyển dụng**: Tạo và quản lý tin tuyển dụng, tiếp nhận và sàng lọc hồ sơ ứng viên.
*   **Quy trình phỏng vấn**: Sắp xếp lịch phỏng vấn, phân công người phỏng vấn (Interviewers) và đánh giá ứng viên.

### 4. Lương & Phúc Lợi (Payroll System)
*   **Tính lương tự động**: Tự động tính toán bảng lương hàng tháng dựa trên dữ liệu chấm công, thuế, bảo hiểm, phụ cấp và các khoản giảm trừ.
*   **Bảng lương PDF**: Hỗ trợ xuất và gửi phiếu lương (payslips) bảo mật dạng PDF trực tiếp đến email nhân viên.

### 5. Đánh Giá Hiệu Suất (Performance Appraisal)
*   **Mục tiêu (KPI/OKR)**: Thiết lập mục tiêu cho cá nhân/phòng ban.
*   **Chu kỳ đánh giá**: Quy trình đánh giá định kỳ 360 độ từ quản lý, đồng nghiệp và tự đánh giá.

### 6. Truyền Thông & Tương Tác Thời Gian Thực (Real-time Chat & Notifications)
*   **Real-time Chat**: Hệ thống nhắn tin nội bộ (Chat Widget) cho phép giao tiếp trực tiếp và theo nhóm.
*   **Hệ thống thông báo**: Thông báo tức thời (qua WebSocket và Email) khi có yêu cầu phê duyệt đơn phép, nhắc lịch phỏng vấn, hoặc bảng lương mới.

---

## 🛠️ Công Nghệ Sử Dụng (Tech Stack)

### Backend (Spring Boot Eco-system)
*   **Framework**: Java 17, Spring Boot 3.3.0
*   **Security**: Spring Security, JWT (JSON Web Token)
*   **Data Access**: Spring Data JPA, Hibernate, PostgreSQL 16
*   **Database Migration**: Flyway Migration (quản lý lịch sử và cập nhật schema tự động)
*   **Caching & Session**: Spring Data Redis (cache dữ liệu, lưu trữ session, hỗ trợ WebSocket)
*   **File Storage**: MinIO Object Storage (quản lý avatar, tài liệu ứng viên, payslips PDF)
*   **Real-time & Communication**: Spring WebSocket & STOMP, Spring Mail & Thymeleaf (template email)
*   **Document Generators**: Apache POI (xuất báo cáo Excel), OpenPDF (xuất phiếu lương PDF)

### Frontend (React Single Page Application)
*   **Core**: React 19, TypeScript, Vite
*   **State Management**: Redux Toolkit (global state), TanStack Query v5 (server state)
*   **Routing**: React Router DOM v7
*   **Styling & UI**: Tailwind CSS, Radix UI (chất lượng cao, dễ tùy biến), Lucide Icons
*   **Real-time Client**: `@stomp/stompjs` (kết nối WebSocket qua giao thức STOMP)
*   **Charts & Visualization**: Recharts (biểu diễn dashboard nhân sự trực quan)
*   **Notifications**: Sonner (Toast notifications mượt mà)

---

## 📁 Cấu Trúc Dự Án (Project Structure)

```text
├── backend                  # Spring Boot Backend Code
│   ├── src/main/java/com/hrmpro
│   │   ├── common           # Các lớp dùng chung, Exception Handler, Scheduler
│   │   ├── config           # Cấu hình Security, Redis, MinIO, WebSocket, Async
│   │   └── module           # Các module nghiệp vụ (auth, employee, attendance, recruitment...)
│   └── pom.xml              # Maven dependencies
│
├── frontend                 # React Frontend Code
│   ├── src
│   │   ├── components       # Component UI tái sử dụng (button, dialog, select, ...)
│   │   ├── hooks            # Custom react hooks
│   │   ├── modules          # Quản lý giao diện & logic theo module nghiệp vụ
│   │   └── store            # Cấu hình Redux Toolkit
│   └── vite.config.ts       # Cấu hình Vite
│
└── docker-compose.yml       # Cấu hình container chạy các dịch vụ hỗ trợ (DB, Redis, MinIO...)
```

---

## ⚙️ Yêu Cầu Hệ Thống (Prerequisites)

*   **Java JDK 17** hoặc cao hơn.
*   **Node.js 18+** & **npm 9+**.
*   **Maven 3.8+** (nếu không dùng Maven Wrapper `./mvnw`).
*   **Docker & Docker Compose** (được khuyến nghị để khởi chạy các dịch vụ bên thứ ba dễ dàng).

---

## 🔧 Hướng Dẫn Cài Đặt & Chạy Local

### Bước 1: Khởi Chạy Các Dịch Vụ Hỗ Trợ Với Docker
HRMPro sử dụng PostgreSQL, Redis, MinIO và MailHog làm môi trường chạy. Bạn có thể khởi động nhanh các dịch vụ này bằng lệnh:

```bash
docker-compose up -d redis minio mailhog
```

*(Lưu ý: Nếu bạn muốn chạy PostgreSQL thông qua Docker, hãy bỏ comment phần dịch vụ `postgres` trong file `docker-compose.yml` trước khi chạy).*

### Bước 2: Cấu Hình Biến Môi Trường (Environment Variables)

#### Backend Configuration
Tạo file `backend/src/main/resources/application-local.yml` (hoặc cấu hình các biến môi trường trong file cấu hình hiện tại của bạn) với các thông tin kết nối sau:

```yaml
spring:
  datasource:
    url: jdbc:postgresql://localhost:5432/hrmpro
    username: your_postgres_user
    password: your_postgres_password
  data:
    redis:
      host: localhost
      port: 6379
      password: your_redis_password
  mail:
    host: localhost
    port: 1025 # MailHog SMTP Port

app:
  jwt:
    secret: your_super_secure_jwt_secret_key_must_be_at_least_256_bits_long
    expiration-ms: 86400000 # 24 giờ
    refresh-expiration-ms: 604800000 # 7 ngày
  minio:
    endpoint: http://localhost:9000
    access-key: minio_root_user
    secret-key: minio_root_password
```

#### Frontend Configuration
Tạo file `frontend/.env` trong thư mục frontend:

```env
VITE_API_BASE_URL=http://localhost:8080/api/v1
VITE_WS_URL=ws://localhost:8080/ws
VITE_APP_NAME=HRMPro
```

### Bước 3: Khởi Chạy Backend (Spring Boot)
Di chuyển vào thư mục `backend` và chạy ứng dụng:

```bash
cd backend
# Dùng maven wrapper có sẵn trong dự án
./mvnw spring-boot:run
```

*Flyway sẽ tự động chạy và khởi tạo cấu trúc database (migrations) khi backend khởi động thành công.*

### Bước 4: Khởi Chạy Frontend (React)
Di chuyển vào thư mục `frontend`, cài đặt dependencies và khởi động môi trường dev:

```bash
cd frontend
npm install
npm run dev
```

Ứng dụng sẽ khả dụng trên trình duyệt tại địa chỉ: `http://localhost:5173`.

---

## 🐳 Triển Khai Với Docker (Production Ready)

Hệ thống đã được cấu hình sẵn sàng cho việc đóng gói bằng Docker. Để triển khai toàn bộ hệ thống lên production:

1.  Mở file `docker-compose.yml` và kích hoạt (uncomment) các dịch vụ `postgres`, `backend`, và `frontend`.
2.  Tạo file `.env` ở thư mục gốc chứa các biến môi trường cấu hình:
    ```env
    DB_NAME=hrmpro
    DB_USER=postgres
    DB_PASSWORD=your_secure_db_password
    DB_PORT=5432
    REDIS_PORT=6379
    REDIS_PASSWORD=your_secure_redis_password
    MINIO_PORT=9000
    MINIO_CONSOLE_PORT=9001
    MINIO_ROOT_USER=minioadmin
    MINIO_ROOT_PASSWORD=your_secure_minio_password
    JWT_SECRET=your_super_secure_jwt_secret_key
    JWT_EXPIRATION_MS=86400000
    JWT_REFRESH_EXPIRATION_MS=604800000
    CORS_ALLOWED_ORIGINS=http://localhost:5173,http://localhost
    PAYROLL_CRON=0 0 0 1 * ? # Chạy tính lương vào ngày 1 hàng tháng
    ```
3.  Chạy lệnh build và khởi động toàn bộ hệ thống:
    ```bash
    docker-compose up -d --build
    ```

---

## 📡 Tích Hợp Real-time WebSocket
Hệ thống sử dụng WebSocket thông qua giao thức **STOMP** để xử lý thông báo tức thời và cửa sổ trò chuyện realtime.
*   **Endpoint kết nối chính**: `/ws` (Được bảo mật bằng JWT Interceptor qua cổng handshake).
*   **Các topic phổ biến**:
    *   `/topic/notifications/{userId}`: Đăng ký nhận thông báo cá nhân theo thời gian thực.
    *   `/topic/chat/{roomId}`: Kênh giao tiếp phòng chat realtime.

---

## 🛠️ Quản Lý Phiên Bản Cơ Sở Dữ Liệu (Flyway Migrations)
Tất cả thay đổi schema SQL được quản lý chặt chẽ thông qua thư mục `backend/src/main/resources/db/migration`.
*   Khi phát triển tính năng mới yêu cầu thay đổi cấu trúc bảng, hãy tạo file migration mới với định dạng: `V{Version}__{Description}.sql`.
*   Tránh sửa đổi các file migration cũ đã được release.

---

## 📝 Quy Định Đóng Góp (Contributing)
1.  **Branching Strategy**:
    *   `main`: Nhánh chạy production ổn định.
    *   `dev`: Nhánh tích hợp các tính năng mới phục vụ kiểm thử.
    *   `feature/*`: Nhánh phát triển tính năng cá nhân, được rẽ nhánh từ `dev` và tạo Pull Request trở lại `dev`.
2.  **Commit Message**:
    *   Tuân thủ quy chuẩn Conventional Commits (ví dụ: `feat(leave): enforce 16-day annual leave limit`, `fix(backend): resolve NumberFormatException in RecruitmentService`).

---

## 📄 Bản Quyền (License)
Dự án được phân phối dưới giấy phép **MIT License**. Xem chi tiết tại file `LICENSE` (nếu có).

---
*Phát triển bởi đội ngũ kỹ sư HRMPro.*
