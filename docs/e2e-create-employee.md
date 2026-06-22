# Hướng Dẫn Toàn Diện (E2E): Tạo Và Kích Hoạt Tài Khoản Nhân Viên Mới

Tài liệu này là hướng dẫn thực hành từng bước (End-to-End) dành cho bộ phận Nhân sự (HR) hoặc Quản trị viên hệ thống để thêm một nhân sự mới vào phần mềm HRMPro và cấp tài khoản làm việc cho họ.

---

## Giai Đoạn 1: Chuẩn Bị Thông Tin
Trước khi thực hiện trên phần mềm, bạn cần có sẵn các thông tin cơ bản của nhân sự mới:
- **Thông tin cá nhân**: Họ tên đầy đủ, Ngày sinh, Số điện thoại, Căn cước công dân.
- **Thông tin công tác**: Email công ty (Bắt buộc để tạo tài khoản), Phòng ban, Vị trí/Chức danh, Ngày bắt đầu làm việc.

---

## Giai Đoạn 2: Tạo Hồ Sơ Nhân Sự 
*Mục đích: Lưu trữ dữ liệu thông tin lý lịch và công tác của nhân sự vào hệ thống.*

1. Đăng nhập vào hệ thống HRMPro với tài khoản Quản lý nhân sự (**HR_ADMIN**) hoặc Nhân sự (**HR_STAFF**).
2. Trên thanh công cụ bên trái, chọn module **Nhân sự (Employees)** > Chọn **Danh sách nhân viên**.
3. Nhấn vào nút **[ + Thêm Mới ]** ở góc trên cùng bên phải màn hình.
4. Điền các thông tin theo biểu mẫu:
   - **Thông tin cơ bản**: Điền đầy đủ Họ Tên, Ngày sinh. Đặc biệt chú ý nhập chính xác **Email công ty**.
   - **Công tác**: Chọn đúng *Phòng ban (Department)* và *Chức vụ (Position)* từ danh sách sổ xuống.
5. Nhấn **Lưu thông tin**. 
   > 🎉 Lúc này hệ thống sẽ báo tạo thành công và tự động cấp cho nhân viên một **Mã Nhân Viên (ID)** duy nhất.

---

## Giai Đoạn 3: Cấp Tài Khoản Hệ Thống
*Mục đích: Cấp quyền đăng nhập phần mềm cho hồ sơ nhân sự vừa tạo ở Giai đoạn 2.*

1. Mở trang chi tiết của nhân viên vừa tạo. Chuyển sang tab **Tài khoản (Account)**.
2. Nhấn nút **[ Cấp Tài Khoản Đăng Nhập ]**.
3. Hệ thống sẽ tự động điền Tên đăng nhập (Username) chính là **Email công ty** của nhân viên.
4. **Chọn quyền hạn (Role)**:
   - Mặc định chọn **EMPLOYEE (Nhân viên)** để họ tự quản lý dữ liệu cá nhân (chấm công, nghỉ phép).
   - *Lưu ý:* Chỉ cấp quyền MANAGER nếu người này là Trưởng phòng, hoặc cấp HR_STAFF nếu họ thuộc bộ phận Nhân sự.
5. **Cấp mật khẩu**:
   - Khuyên dùng: Chọn tùy chọn **"Hệ thống tự động tạo mật khẩu ngẫu nhiên và gửi qua Email"**.
   - Hoặc bạn có thể nhập mật khẩu mặc định (Ví dụ: `Hrmpro@123`) và báo thủ công cho nhân viên.
6. Nhấn **[ Xác nhận ]**. Trạng thái tài khoản sẽ chuyển thành *Chờ kích hoạt*.

---

## Giai Đoạn 4: Kích Hoạt Tài Khoản (Dành cho Nhân viên mới)
*Giai đoạn này do chính **Nhân viên mới** thực hiện. Bạn có thể gửi hướng dẫn này cho họ.*

1. Nhân viên mở hộp thư Email công ty.
2. Tìm email từ hệ thống HRMPro với tiêu đề: *"Thông tin tài khoản đăng nhập hệ thống của bạn"*.
3. Mở email, copy **Mật khẩu tạm thời** hệ thống đã cấp.
4. Truy cập vào trang web của HRMPro và tiến hành Đăng nhập:
   - **Tên đăng nhập**: Email công ty của bạn.
   - **Mật khẩu**: Dán mật khẩu tạm thời vừa copy.
5. **Đổi mật khẩu bảo mật**:
   - Ngay trong lần đăng nhập đầu tiên, hệ thống sẽ yêu cầu đổi mật khẩu.
   - Nhập mật khẩu hiện tại (tạm thời) và tạo mật khẩu mới theo ý bạn (Khuyến nghị: Ít nhất 8 ký tự, có chữ hoa, chữ thường và số).
   - Nhấn **[ Cập nhật mật khẩu ]**.
6. Quá trình kích hoạt hoàn tất. Bạn sẽ được tự động chuyển đến Trang chủ hệ thống (Dashboard).

---

## ✅ Kiểm Tra Hoàn Thành (Checklist cho HR)
Để đảm bảo quy trình không có sai sót, bạn hãy kiểm tra lại 3 yếu tố sau:
- [ ] Hồ sơ nhân sự hiển thị trạng thái công tác: **Đang làm việc (Active)**.
- [ ] Ở phần Tài khoản của nhân viên hiển thị trạng thái: **Đã kích hoạt (Activated)**.
- [ ] Nhân sự mới xác nhận đã đăng nhập thành công và nhìn thấy đúng tên phòng ban/quản lý của mình.
