# HRMPro - Enterprise Human Resource Management System

[![Java](https://img.shields.io/badge/Java-17-orange.svg)](https://www.oracle.com/java/)
[![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.3.0-6DB33F.svg)](https://spring.io/projects/spring-boot)
[![React](https://img.shields.io/badge/React-19.2-149ECA.svg)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-6.0-3178C6.svg)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-8.0-646CFF.svg)](https://vitejs.dev/)
[![Playwright](https://img.shields.io/badge/Playwright-E2E-45BA4B.svg)](https://playwright.dev/)

**HRMPro** là hệ thống quản trị nhân sự toàn diện cho doanh nghiệp, bao phủ các nghiệp vụ nhân sự cốt lõi: quản lý hồ sơ nhân viên, cơ cấu tổ chức, chấm công, nghỉ phép, tính lương, tuyển dụng, đánh giá hiệu suất, dashboard phân tích, chat nội bộ và thông báo thời gian thực.

Dự án được thiết kế theo kiến trúc full-stack hiện đại với **Spring Boot 3 + Java 17** ở backend, **React 19 + TypeScript + Vite** ở frontend, sử dụng PostgreSQL cho dữ liệu nghiệp vụ, MongoDB cho dữ liệu chat, Redis cho cache/session realtime, MinIO cho object storage và Docker Compose cho hạ tầng local/production.

## Mục Lục

- [Tính năng chính](#tinh-nang-chinh)
- [Kiến trúc tổng quan](#kien-truc-tong-quan)
- [Công nghệ và thư viện](#cong-nghe-va-thu-vien)
- [Cấu trúc thư mục](#cau-truc-thu-muc)
- [Yêu cầu môi trường](#yeu-cau-moi-truong)
- [Cài đặt local](#cai-dat-local)
- [Biến môi trường](#bien-moi-truong)
- [Database migration](#database-migration)
- [Kiểm thử](#kiem-thu)
- [Build và triển khai production](#build-va-trien-khai-production)
- [Quy ước phát triển](#quy-uoc-phat-trien)

<a id="tinh-nang-chinh"></a>

## Tính Năng Chính

### Auth, RBAC và bảo mật

- Đăng nhập, refresh token và xác thực JWT stateless.
- Phân quyền theo role/permission cho HR, manager và employee.
- Spring Security method-level authorization với `@PreAuthorize`.
- Redis hỗ trợ cache/session/token invalidation theo thiết kế triển khai.

### Employee và Organization

- Quản lý hồ sơ nhân viên, thông tin cá nhân, liên hệ, trạng thái làm việc.
- Quản lý phòng ban, chức vụ và quan hệ tổ chức.
- Kết nối dữ liệu nhân sự với payroll, attendance, leave và recruitment.

### Attendance và Leave

- Ghi nhận chấm công, check-in/check-out và tổng hợp dữ liệu công.
- Quản lý đơn nghỉ phép, số dư phép và quy trình phê duyệt.
- Hỗ trợ dashboard cho cá nhân, manager và HR.

### Payroll

- Quản lý kỳ lương, phiếu lương, phụ cấp, khấu trừ và tính lương.
- Xuất báo cáo Excel bằng Apache POI.
- Sinh payslip PDF bằng OpenPDF.
- Lưu trữ file payslip/tài liệu lên MinIO.

### Recruitment

- Quản lý tin tuyển dụng, hồ sơ ứng viên và pipeline tuyển dụng.
- Theo dõi stage ứng viên: `NEW`, `SCREENING`, `INTERVIEW`, `OFFER`, `HIRED`, `REJECTED`.
- Lên lịch phỏng vấn, cập nhật kết quả và gửi thông báo/email.

### Performance, Dashboard, Chat và Notification

- Module đánh giá hiệu suất và KPI.
- Dashboard tổng hợp dữ liệu nhân sự.
- Chat nội bộ sử dụng MongoDB cho lịch sử hội thoại.
- WebSocket/STOMP cho luồng realtime và thông báo tức thời.

<a id="kien-truc-tong-quan"></a>

## Kiến Trúc Tổng Quan

```mermaid
flowchart TD
    Client[React 19 SPA<br/>TypeScript + Vite] --> Router[React Router DOM v7]
    Client --> Query[TanStack Query v5]
    Client --> Redux[Redux Toolkit]
    Client --> WSClient[STOMP WebSocket Client]

    Router --> API[Axios API Client]
    Query --> API
    API --> Security[Spring Security 6<br/>JWT Access/Refresh Token]
    WSClient --> WebSocket[Spring WebSocket/STOMP]

    Security --> Controllers[REST Controllers<br/>/api/v1]
    Controllers --> Services[Service Layer]
    Services --> Repositories[Spring Data Repositories]

    Repositories --> PostgreSQL[(PostgreSQL<br/>Business Data)]
    Services --> Redis[(Redis<br/>Cache/Session)]
    Services --> MongoDB[(MongoDB<br/>Chat Messages)]
    Services --> MinIO[(MinIO<br/>Avatars/Documents/Payslips)]
    Services --> Mail[Spring Mail + Thymeleaf]
    Services --> Reports[Apache POI + OpenPDF]
```

Backend tổ chức theo module nghiệp vụ, mỗi module thường gồm `controller`, `service`, `repository`, `entity`, `dto` và test tương ứng. Frontend tổ chức theo `src/modules`, mỗi module tách riêng page, API client, component và type khi cần.

<a id="cong-nghe-va-thu-vien"></a>

## Công Nghệ Và Thư Viện

### Backend

| Nhóm | Công nghệ / thư viện |
| --- | --- |
| Runtime | Java 17 |
| Framework | Spring Boot 3.3.0 |
| Web API | Spring Web MVC |
| Security | Spring Security 6, JJWT `0.12.5` |
| Persistence | Spring Data JPA, Hibernate |
| Database | PostgreSQL driver, Flyway Core, Flyway PostgreSQL |
| Cache / session | Spring Data Redis, Redis 7 |
| NoSQL | Spring Data MongoDB, MongoDB 7 |
| Storage | MinIO Java SDK `8.5.9` |
| Email / template | Spring Mail, Thymeleaf |
| Realtime | Spring WebSocket, STOMP |
| Validation | Spring Boot Validation, Jakarta Validation |
| AOP | Spring Boot Starter AOP |
| Export | Apache POI `5.2.5` cho Excel, OpenPDF `2.0.1` cho PDF |
| Boilerplate | Lombok |
| Testing | Spring Boot Test, Spring Security Test, JUnit 5, H2, Testcontainers `1.19.8` |
| Coverage | JaCoCo Maven Plugin `0.8.12`, minimum line coverage 70% |
| Build | Maven, Spring Boot Maven Plugin, Maven Surefire |

### Frontend

| Nhóm | Công nghệ / thư viện |
| --- | --- |
| Runtime / build | Vite `8.0.12`, TypeScript `~6.0.2` |
| UI core | React `19.2.6`, React DOM `19.2.6` |
| Routing | React Router DOM `7.17.0` |
| Server state | TanStack React Query `5.101.0` |
| Client state | Redux Toolkit `2.12.0`, React Redux `9.3.0` |
| HTTP client | Axios `1.17.0` |
| Form | React Hook Form `7.78.0`, `@hookform/resolvers` |
| Validation | Zod `4.4.3` |
| UI primitives | Radix UI Avatar, Checkbox, Dialog, Dropdown Menu, Label, Scroll Area, Select, Separator, Slot, Tabs |
| Styling | Tailwind CSS `3.4.19`, PostCSS, Autoprefixer, `tailwind-merge`, `tailwindcss-animate`, `class-variance-authority`, `clsx` |
| Icons | Lucide React `1.17.0` |
| Charts | Recharts `3.8.1` |
| Date/time | Day.js `1.11.21` |
| Theme | `next-themes` |
| Toast | Sonner `2.0.7` |
| Realtime | `@stomp/stompjs` `7.3.0` |
| Lint | ESLint `10.3.0`, TypeScript ESLint, React Hooks plugin, React Refresh plugin |
| E2E | Playwright `1.44.1` |

### Infrastructure

| Thành phần | Mô tả |
| --- | --- |
| Docker Compose | Chạy Redis, MongoDB, MinIO, MailHog; có sẵn cấu hình comment cho PostgreSQL, backend và frontend |
| PostgreSQL 16 | Database quan hệ cho dữ liệu nghiệp vụ |
| Redis 7 Alpine | Cache/session/realtime support |
| MongoDB 7 | Lưu lịch sử chat/message |
| MinIO | S3-compatible object storage |
| MailHog | SMTP catcher cho môi trường local/dev |

<a id="cau-truc-thu-muc"></a>

## Cấu Trúc Thư Mục

```text
HRMPro/
├── backend/
│   ├── pom.xml
│   └── src/
│       ├── main/
│       │   ├── java/com/hrmpro/
│       │   │   ├── common/
│       │   │   ├── config/
│       │   │   └── module/
│       │   │       ├── attendance/
│       │   │       ├── auth/
│       │   │       ├── chat/
│       │   │       ├── dashboard/
│       │   │       ├── employee/
│       │   │       ├── leave/
│       │   │       ├── notification/
│       │   │       ├── organization/
│       │   │       ├── payroll/
│       │   │       ├── performance/
│       │   │       └── recruitment/
│       │   └── resources/
│       │       ├── application.yml
│       │       └── db/migration/
│       └── test/
├── frontend/
│   ├── package.json
│   ├── vite.config.ts
│   ├── playwright.config.ts
│   └── src/
│       ├── components/
│       ├── config/
│       ├── modules/
│       │   ├── attendance/
│       │   ├── auth/
│       │   ├── dashboard/
│       │   ├── employee/
│       │   ├── leave/
│       │   ├── organization/
│       │   ├── payroll/
│       │   ├── performance/
│       │   ├── recruitment/
│       │   └── users/
│       └── store/
├── docs/
├── docker-compose.yml
├── TESTING.md
└── README.md
```

<a id="yeu-cau-moi-truong"></a>

## Yêu Cầu Môi Trường

- Java JDK 17+
- Maven 3.9+ hoặc Maven Wrapper nếu được bổ sung vào dự án
- Node.js 20+ và npm 10+ khuyến nghị cho frontend hiện tại
- Docker Desktop hoặc Docker Engine
- PostgreSQL 16 nếu chạy database ngoài Docker
- PowerShell, Bash hoặc shell tương đương

<a id="cai-dat-local"></a>

## Cài Đặt Local

### 1. Clone và cài dependency

```bash
git clone <repository-url>
cd HRMPro

cd frontend
npm install
cd ..
```

Backend dùng Maven, dependency sẽ được tải khi chạy `mvn test`, `mvn verify` hoặc `mvn spring-boot:run`.

### 2. Chuẩn bị biến môi trường

Tạo file `.env` ở thư mục gốc. Không dùng secret production thật trong local và không commit credential nhạy cảm.

```env
DB_NAME=hrmpro
DB_USER=postgres
DB_PASSWORD=change_me
DB_PORT=5432

SPRING_DATASOURCE_URL=jdbc:postgresql://localhost:5432/hrmpro
SPRING_DATASOURCE_USERNAME=postgres
SPRING_DATASOURCE_PASSWORD=change_me

SPRING_DATA_MONGODB_URI=mongodb://admin:change_me@localhost:27017/hrmpro_chat?authSource=admin

REDIS_PORT=6379
REDIS_PASSWORD=change_me
SPRING_DATA_REDIS_HOST=localhost
SPRING_DATA_REDIS_PORT=6379
SPRING_DATA_REDIS_PASSWORD=change_me

MINIO_ROOT_USER=minioadmin
MINIO_ROOT_PASSWORD=change_me
MINIO_PORT=9000
MINIO_CONSOLE_PORT=9001

APP_MINIO_ENDPOINT=http://localhost:9000
APP_MINIO_ACCESS_KEY=minioadmin
APP_MINIO_SECRET_KEY=change_me

APP_JWT_SECRET=replace_with_base64_256_bit_secret
APP_JWT_EXPIRATION_MS=86400000
APP_JWT_REFRESH_EXPIRATION_MS=604800000

SPRING_MAIL_HOST=localhost
SPRING_MAIL_PORT=1025

APP_CORS_ALLOWED_ORIGINS=http://localhost:5173
APP_PAYROLL_CRON=0 0 8 25 * ?
APP_AUDIT_LOG_RETENTION_DAYS=90
SPRING_JPA_FORMAT_SQL=false
```

Frontend nếu cần cấu hình riêng có thể tạo `frontend/.env`:

```env
VITE_API_BASE_URL=http://localhost:8080/api/v1
VITE_WS_URL=ws://localhost:8080/ws
VITE_APP_NAME=HRMPro
```

### 3. Chạy hạ tầng phụ trợ

Compose hiện bật sẵn Redis, MongoDB, MinIO và MailHog. PostgreSQL, backend và frontend đang được comment để phù hợp workflow chạy app trực tiếp trên máy dev.

```bash
docker compose up -d redis mongo minio mailhog
```

Nếu muốn chạy PostgreSQL bằng Docker, bỏ comment service `postgres` trong `docker-compose.yml`, sau đó chạy:

```bash
docker compose up -d postgres redis mongo minio mailhog
```

### 4. Chạy backend

```bash
cd backend
mvn spring-boot:run
```

Backend mặc định phục vụ REST API tại:

```text
http://localhost:8080/api/v1
```

### 5. Chạy frontend

```bash
cd frontend
npm run dev
```

Ứng dụng frontend chạy tại:

```text
http://localhost:5173
```

### 6. Công cụ local hữu ích

```text
MailHog UI:        http://localhost:8025
MinIO API:         http://localhost:9000
MinIO Console:     http://localhost:9001
Redis:             localhost:6379
MongoDB:           localhost:27017
```

<a id="bien-moi-truong"></a>

## Biến Môi Trường

### Backend

| Biến | Mục đích |
| --- | --- |
| `SPRING_DATASOURCE_URL` | JDBC URL PostgreSQL |
| `SPRING_DATASOURCE_USERNAME` | User PostgreSQL |
| `SPRING_DATASOURCE_PASSWORD` | Password PostgreSQL |
| `SPRING_DATA_MONGODB_URI` | Connection string MongoDB |
| `SPRING_DATA_REDIS_HOST` | Redis host |
| `SPRING_DATA_REDIS_PORT` | Redis port |
| `SPRING_DATA_REDIS_PASSWORD` | Redis password |
| `SPRING_MAIL_HOST` | SMTP host |
| `SPRING_MAIL_PORT` | SMTP port |
| `APP_JWT_SECRET` | Secret ký JWT, bắt buộc đủ mạnh ở production |
| `APP_JWT_EXPIRATION_MS` | Thời gian sống access token |
| `APP_JWT_REFRESH_EXPIRATION_MS` | Thời gian sống refresh token |
| `APP_MINIO_ENDPOINT` | Endpoint MinIO/S3 |
| `APP_MINIO_ACCESS_KEY` | Access key storage |
| `APP_MINIO_SECRET_KEY` | Secret key storage |
| `APP_CORS_ALLOWED_ORIGINS` | Origin frontend được phép gọi API |
| `APP_PAYROLL_CRON` | Cron chạy tác vụ payroll |
| `APP_AUDIT_LOG_RETENTION_DAYS` | Số ngày giữ audit log |

### Frontend

| Biến | Mục đích |
| --- | --- |
| `VITE_API_BASE_URL` | Base URL REST API |
| `VITE_WS_URL` | WebSocket endpoint |
| `VITE_APP_NAME` | Tên hiển thị ứng dụng |

<a id="database-migration"></a>

## Database Migration

Backend bật Flyway trong `backend/src/main/resources/application.yml`:

```yaml
spring:
  flyway:
    enabled: true
    baseline-on-migrate: true
    locations: classpath:db/migration
```

Quy ước migration:

- File SQL đặt tại `backend/src/main/resources/db/migration`.
- Tên file theo chuẩn Flyway: `V<version>__<description>.sql`.
- Không sửa migration đã chạy ở môi trường shared/production; tạo migration mới để thay đổi schema.
- `spring.jpa.hibernate.ddl-auto` đang để `none`, schema phải được quản lý bằng Flyway.

<a id="kiem-thu"></a>

## Kiểm Thử

Xem chi tiết trong [TESTING.md](TESTING.md).

### Backend

```bash
cd backend
mvn test
mvn verify
```

`mvn verify` chạy JaCoCo report và kiểm tra ngưỡng coverage theo cấu hình trong `pom.xml`.

### Frontend

```bash
cd frontend
npm run lint
npm run build
npm run test:e2e
```

Các script frontend hiện có:

| Script | Mục đích |
| --- | --- |
| `npm run dev` | Chạy Vite dev server |
| `npm run build` | Type-check bằng `tsc -b` và build production |
| `npm run lint` | Chạy ESLint |
| `npm run preview` | Preview bundle production |
| `npm run test:e2e` | Chạy Playwright E2E |
| `npm run test:e2e:headed` | Chạy Playwright có browser UI |
| `npm run test:e2e:report` | Mở report Playwright |

<a id="build-va-trien-khai-production"></a>

## Build Và Triển Khai Production

### Backend package

```bash
cd backend
mvn clean package
```

Artifact sinh ra trong:

```text
backend/target/
```

### Frontend production build

```bash
cd frontend
npm ci
npm run build
```

Static assets sinh ra trong:

```text
frontend/dist/
```

### Docker Compose production

`docker-compose.yml` đã có skeleton cho backend/frontend/postgres nhưng một số service đang comment. Khi triển khai production:

1. Bỏ comment các service cần chạy bằng Docker: `postgres`, `backend`, `frontend`.
2. Tạo file `.env` production bằng secret thật và không commit file này.
3. Đặt `APP_CORS_ALLOWED_ORIGINS` theo domain frontend thật.
4. Đặt JWT secret đủ mạnh, luân chuyển định kỳ.
5. Cấu hình volume bền vững cho PostgreSQL, MongoDB, Redis và MinIO.
6. Đặt reverse proxy/TLS ở phía trước backend/frontend nếu deploy lên VPS hoặc cloud.
7. Chạy:

```bash
docker compose up -d --build
```

### Production checklist

- Không dùng credential mặc định trong `.env`.
- Bật HTTPS ở reverse proxy/load balancer.
- Giới hạn CORS đúng domain.
- Backup PostgreSQL, MongoDB và MinIO định kỳ.
- Theo dõi log backend, Redis, MongoDB, PostgreSQL và MinIO.
- Tách secret bằng secret manager nếu deploy lên cloud.
- Không expose trực tiếp PostgreSQL, Redis, MongoDB ra public internet.
- Chạy `mvn verify`, `npm run lint`, `npm run build` và E2E quan trọng trước khi release.

<a id="quy-uoc-phat-trien"></a>

## Quy Ước Phát Triển

### Backend

- Tổ chức code theo module nghiệp vụ trong `com.hrmpro.module`.
- Controller chỉ xử lý HTTP contract, validation và authorization.
- Business logic đặt trong service, persistence đặt trong repository.
- Response API dùng DTO, không trả entity trực tiếp nếu entity có quan hệ phức tạp hoặc dữ liệu nhạy cảm.
- Validation đầu vào bằng Jakarta Validation.
- Thay đổi schema bằng Flyway migration.
- Test service/controller cho luồng nghiệp vụ quan trọng.

### Frontend

- Tách logic theo module trong `frontend/src/modules`.
- Dữ liệu server dùng TanStack Query; state client/global dùng Redux Toolkit.
- Form dùng React Hook Form và Zod resolver khi cần validation.
- API call tập trung qua Axios client trong `src/config` hoặc API module tương ứng.
- UI primitive dùng Radix; styling bằng Tailwind CSS.
- Không hard-code endpoint production trong component.

### Git và chất lượng

- Mỗi feature/fix nên đi kèm test phù hợp với rủi ro thay đổi.
- Không commit secret, token, file build hoặc log runtime.
- Chạy lint/build/test trước khi mở pull request.
- README và tài liệu vận hành cần được cập nhật khi thay đổi stack, port, env hoặc workflow deploy.

## Tài Liệu Liên Quan

- [TESTING.md](TESTING.md): chiến lược test, cách chạy test và ghi chú coverage.
- [docker-compose.yml](docker-compose.yml): cấu hình hạ tầng local và skeleton deploy.
- [backend/pom.xml](backend/pom.xml): dependency backend và Maven plugins.
- [frontend/package.json](frontend/package.json): dependency frontend và npm scripts.

## Tác Giả

Phát triển và duy trì bởi **Nguyễn Tấn Thái Dương**.

- GitHub: [DuongGB](https://github.com/DuongGB)
- LinkedIn: [Nguyễn Tấn Thái Dương](https://www.linkedin.com/in/d%C6%B0%C6%A1ng-nguy%E1%BB%85n-7528a736a/)
- Email: [duongnguyenqn1323@gmail.com](mailto:duongnguyenqn1323@gmail.com)
