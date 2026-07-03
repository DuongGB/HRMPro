# Hướng dẫn Phân Quyền trong Hệ Thống HRMPro

Tài liệu này giúp người dùng hiểu rõ về các vai trò (Role) trong hệ thống HRMPro và những thao tác mà từng vai trò được phép thực hiện trên hệ thống. Ngôn ngữ được sử dụng gần gũi, đơn giản giúp mọi thành viên đều có thể nắm bắt nhanh chóng.

## 1. Các Vai Trò Trong Hệ Thống

Hệ thống HRMPro được chia thành 6 vai trò chính, từ cấp độ nhân viên cho đến quản trị viên cấp cao:

1. **Quản trị Hệ thống (SUPER_ADMIN)**: Người có quyền hạn cao nhất, phụ trách thiết lập hệ thống và quản lý tài khoản người dùng.
2. **Quản lý Nhân sự (HR_ADMIN)**: Giám đốc hoặc Trưởng phòng Nhân sự, phụ trách quyết định toàn bộ hoạt động nhân sự của công ty.
3. **Nhân viên Nhân sự (HR_STAFF)**: Chuyên viên nhân sự hỗ trợ các công việc vận hành, giấy tờ và dữ liệu hàng ngày.
4. **Trưởng bộ phận / Quản lý (MANAGER)**: Người phụ trách điều hành một phòng ban hoặc một nhóm nhân viên cụ thể.
5. **Nhân viên (EMPLOYEE)**: Tất cả các cán bộ nhân viên trong công ty.
6. **Chuyên viên Tuyển dụng (RECRUITER)**: Người phụ trách tìm kiếm, sàng lọc và quản lý quá trình tuyển dụng ứng viên.

---

## 2. Bảng Tổng Hợp Phân Quyền (Matrix)

Dưới đây là bảng tóm tắt các quyền hạn cơ bản trên từng chức năng (phân hệ) của phần mềm. 

*(Ghi chú: "Toàn quyền" bao gồm việc có thể Tạo mới, Xem, Chỉnh sửa và Xóa dữ liệu)*.

| Tính năng (Phân hệ) | Nhân viên<br>*(EMPLOYEE)* | Quản lý<br>*(MANAGER)* | Tuyển dụng<br>*(RECRUITER)* | Nhân viên NS<br>*(HR_STAFF)* | Quản lý NS<br>*(HR_ADMIN)* | Quản trị HT<br>*(SUPER_ADMIN)* |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **Quản lý Hệ thống (Tài khoản)** | ❌ | ❌ | ❌ | ❌ | ❌ | Toàn quyền |
| **Cơ cấu tổ chức (Phòng ban)**| Xem | Xem | Xem | Xem | Toàn quyền | Toàn quyền |
| **Hồ sơ Nhân viên & Hợp đồng** | Chỉ của bản thân | Chỉ xem của nhân viên cấp dưới | Chỉ xem cơ bản | Xem & Sửa hồ sơ | Toàn quyền | Toàn quyền |
| **Chấm công** | Chỉ của bản thân | Chỉ của nhân viên cấp dưới | ❌ | Xem & Cập nhật | Toàn quyền | Toàn quyền |
| **Nghỉ phép** | Tự tạo & xem của bản thân | Duyệt đơn cho nhân viên cấp dưới | ❌ | Xem danh sách | Toàn quyền | Toàn quyền |
| **Bảng lương** | Tự xem lương bản thân | ❌ | ❌ | Xem (không được duyệt) | Toàn quyền | Toàn quyền |
| **Đánh giá hiệu suất** | Xem kết quả cá nhân | Đánh giá nhân viên cấp dưới | ❌ | Hỗ trợ vận hành | Toàn quyền | Toàn quyền |
| **Tuyển dụng** | ❌ | Xem tin tuyển dụng của bộ phận mình | Toàn quyền | Tham gia hỗ trợ | Toàn quyền | Toàn quyền |

---

## 3. Diễn Giải Chi Tiết

### 3.1. Nhân viên (EMPLOYEE)
Đây là nhóm người dùng phổ biến nhất với mục đích "Tự phục vụ" (Self-service).
- Có thể xem hồ sơ cá nhân, chi tiết hợp đồng lao động và phiếu lương hàng tháng của chính mình.
- Tự theo dõi thời gian chấm công hàng ngày.
- Chủ động tạo đơn xin nghỉ phép và theo dõi tình trạng phê duyệt của Quản lý.
- Nắm bắt được các đánh giá năng lực của cấp trên đối với mình.
- **Lưu ý**: Tuyệt đối không thể xem được dữ liệu (lương, hợp đồng...) của nhân viên khác.

### 3.2. Trưởng bộ phận / Quản lý (MANAGER)
Ngoài các quyền cá nhân như một Nhân viên thông thường, Quản lý được cấp thêm các công cụ để **quản lý riêng cho nhân viên thuộc đội nhóm của mình**:
- Xem hồ sơ và quá trình công tác của nhân viên cấp dưới.
- Theo dõi và đôn đốc tình hình chấm công của cả nhóm.
- Nhận thông báo và phê duyệt (hoặc từ chối) các đơn xin nghỉ phép của nhân viên trong phòng ban.
- Thực hiện đánh giá hiệu suất (KPI/OKR) cho nhân sự cấp dưới.
- Theo dõi các vị trí đang cần tuyển dụng cho phòng ban của mình.

### 3.3. Chuyên viên Tuyển dụng (RECRUITER)
Tập trung 100% vào công tác thu hút nhân tài:
- Đăng tin tuyển dụng và quản lý các vị trí đang mở.
- Tiếp nhận, sàng lọc hồ sơ ứng viên (CV).
- Sắp xếp lịch phỏng vấn và ghi nhận kết quả.
- Được quyền xem qua danh sách nhân sự hiện tại để lên kế hoạch thay thế hoặc hoàn thiện quy trình nhận việc (onboarding) cho ứng viên trúng tuyển.

### 3.4. Nhân viên Nhân sự (HR_STAFF)
Người thực thi các công việc hành chính nhân sự hàng ngày:
- Cập nhật thông tin hồ sơ nhân viên mới, gia hạn hợp đồng.
- Theo dõi biến động nhân sự, theo dõi và chỉnh sửa dữ liệu chấm công khi có sai sót.
- Được quyền xem dữ liệu tính lương hoặc kiểm tra các báo cáo trước khi trình lên Quản lý Nhân sự phê duyệt.
- Tham gia hỗ trợ thiết lập các đợt đánh giá hiệu suất hoặc chạy các chiến dịch tuyển dụng.

### 3.5. Quản lý Nhân sự (HR_ADMIN)
Người chịu trách nhiệm cao nhất về nghiệp vụ chuyên môn Nhân sự - Tiền lương:
- Toàn quyền xây dựng cơ cấu tổ chức (tạo mới phòng ban, chức danh).
- Quyết định việc ký kết, thay đổi hay chấm dứt hợp đồng lao động.
- Quản lý và chốt dữ liệu chấm công của cả công ty.
- Trực tiếp thực hiện nghiệp vụ tính lương, duyệt bảng lương hàng tháng.
- Quản trị các chiến dịch đánh giá hiệu suất định kỳ.

### 3.6. Quản trị viên Hệ thống (SUPER_ADMIN)
Tập trung vào khía cạnh kỹ thuật và bảo mật của phần mềm:
- Cấp quyền, tạo mới tài khoản và khóa tài khoản người dùng khi cần.
- Cài đặt các cấu hình mặc định, thông số hệ thống của công ty.
- Khắc phục sự cố kỹ thuật, xem log và quản trị dữ liệu gốc.
