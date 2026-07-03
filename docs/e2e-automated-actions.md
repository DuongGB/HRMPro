# Hướng Dẫn: Các Tính Năng Tự Động Hóa (Automation) Trên HRMPro

Hệ thống HRMPro được trang bị các trợ lý ảo (Automation) chạy ngầm để giúp bộ phận Nhân sự (HR) giảm thiểu công việc thủ công, hạn chế sai sót do quên lịch và tăng cường trải nghiệm gắn kết cho nhân viên.

Tài liệu này tổng hợp các tính năng tự động hóa và cách hệ thống hoạt động để bạn (với vai trò Quản lý hoặc HR) nắm rõ luồng công việc.

---

## 1. Gửi Thư Chúc Mừng Sinh Nhật & Kỷ Niệm Thâm Niên
**Thời gian chạy tự động:** `08:00 Sáng mỗi ngày`

Mỗi buổi sáng, hệ thống sẽ tự động rà soát "Ngày sinh" và "Ngày bắt đầu làm việc" của tất cả nhân sự đang hoạt động (Active).
- **Chúc mừng sinh nhật:** Nếu hôm nay là sinh nhật của nhân sự, hệ thống sẽ gửi một thông báo trên quả chuông phần mềm và một Email thiết kế trang trọng thay lời chúc mừng từ Ban Giám đốc.
- **Kỷ niệm thâm niên (Work Anniversary):** Tương tự, nếu hôm nay là tròn năm ngày nhân sự gia nhập công ty (1 năm, 2 năm, 3 năm...), hệ thống sẽ gửi một email tri ân sự cống hiến bền bỉ của họ.

> 💡 **Mẹo cho HR:** Bạn không cần phải nhớ sinh nhật của từng người nữa. Chỉ cần đảm bảo nhập chính xác "Ngày sinh" và "Ngày bắt đầu làm việc" lúc tạo hồ sơ ban đầu, phần còn lại hệ thống sẽ tự lo!

---

## 2. Cảnh Báo Hết Hạn Hợp Đồng Lao Động
**Thời gian chạy tự động:** `08:30 Sáng mỗi ngày`

Để tránh việc để quên hợp đồng lao động gây rủi ro pháp lý, hệ thống có cơ chế nhắc nhở sớm rất thông minh:
- Trợ lý ảo sẽ dò tìm các hợp đồng sắp hết hạn trong vòng **15 ngày** và **30 ngày** tới.
- **Đối với Nhân viên:** Gửi thông báo và Email nhắc nhở họ chủ động liên hệ HR để xem xét tái ký hoặc làm thủ tục bàn giao.
- **Đối với Quản lý trực tiếp:** Gửi email thông báo cho Trưởng phòng/Quản lý của nhân viên đó. Email yêu cầu Quản lý sớm đánh giá năng lực nhân viên và gửi đề xuất (Tái ký/Không tái ký) về cho phòng Nhân sự.

> 💡 **Mẹo cho HR:** HR không cần lập file Excel theo dõi hạn hợp đồng nữa. Hãy thông báo cho các Quản lý bộ phận chú ý kiểm tra email hàng ngày để phản hồi đánh giá kịp thời.

---

## 3. Quản Lý Quỹ Ngày Nghỉ Phép (Leave Balance)
Hệ thống tính toán và cấp phát quỹ ngày nghỉ phép (Phép năm) vô cùng chuẩn xác mà không cần HR phải cộng trừ thủ công:

### 3.1. Cấp Mới Quỹ Phép Đầu Năm
**Thời gian chạy tự động:** `00:00 ngày 01/01 (Tết Dương Lịch) hàng năm`
- Vào khoảnh khắc đầu tiên của năm mới, hệ thống tự động thiết lập và cấp mới quỹ ngày phép tiêu chuẩn (ví dụ 12 ngày) cho toàn bộ cán bộ nhân viên đang làm việc.
- *Lưu ý: Hệ thống được thiết lập mức trần số ngày phép tối đa (ví dụ: tối đa 16 ngày) theo chính sách công ty để ngăn việc tích lũy phép vô hạn.*

### 3.2. Cấp Thêm Phép Thâm Niên (Bonus Leave)
**Thời gian chạy tự động:** `00:00 ngày Mùng 1 mỗi tháng`
- Hệ thống tự động rà soát thâm niên làm việc của từng nhân sự.
- **Quy tắc:** Cứ làm việc cống hiến đủ 5 năm, nhân sự sẽ tự động được cộng thêm **1 ngày phép** vào tổng quỹ phép năm của mình. Quy trình này diễn ra hoàn toàn âm thầm.

---

## 4. Đóng Tin Tuyển Dụng Quá Hạn
**Thời gian chạy tự động:** `00:00 mỗi ngày`

- Khi Chuyên viên tuyển dụng (Recruiter) đăng một "Tin Tuyển Dụng" (Job Posting), họ thường thiết lập "Ngày hết hạn nộp hồ sơ".
- Đúng 0 giờ mỗi đêm, hệ thống sẽ rà soát tất cả các tin tuyển dụng đang ở trạng thái mở. Nếu tin nào đã vượt qua ngày hết hạn, hệ thống sẽ tự động khóa tin đó lại (Chuyển sang trạng thái **CLOSED**).
- Ứng viên sẽ không thể tiếp tục nộp CV vào các vị trí đã khóa, giúp đội ngũ tuyển dụng không bị nhận những hồ sơ rác hoặc trễ hạn.

---
*(Ghi chú: Toàn bộ các tác vụ trên được Máy chủ hệ thống thực hiện hoàn toàn tự động, đảm bảo tính nhất quán, không sai sót và cực kỳ bảo mật dữ liệu).*
