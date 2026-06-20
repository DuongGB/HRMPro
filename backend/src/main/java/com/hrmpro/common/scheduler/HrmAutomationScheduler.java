package com.hrmpro.common.scheduler;

import com.hrmpro.common.service.EmailService;
import com.hrmpro.module.employee.entity.Contract;
import com.hrmpro.module.employee.entity.Employee;
import com.hrmpro.module.leave.entity.LeaveBalance;
import com.hrmpro.module.employee.repository.ContractRepository;
import com.hrmpro.module.employee.repository.EmployeeRepository;
import com.hrmpro.module.leave.repository.LeaveBalanceRepository;
import com.hrmpro.module.employee.service.NotificationService;
import com.hrmpro.module.leave.entity.LeaveType;
import com.hrmpro.module.leave.repository.LeaveTypeRepository;
import com.hrmpro.module.recruitment.entity.JobPosting;
import com.hrmpro.module.recruitment.repository.JobPostingRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.Period;
import java.util.List;
import java.util.Optional;

@Component
@RequiredArgsConstructor
@Slf4j
public class HrmAutomationScheduler {

    /**
     * Giới hạn tối đa số ngày phép năm cho một nhân sự (theo chính sách công ty)
     */
    private static final BigDecimal MAX_ANNUAL_LEAVE_DAYS = new BigDecimal("16.0");

    private final EmployeeRepository employeeRepository;
    private final ContractRepository contractRepository;
    private final JobPostingRepository jobPostingRepository;
    private final LeaveBalanceRepository leaveBalanceRepository;
    private final LeaveTypeRepository leaveTypeRepository;
    private final EmailService emailService;
    private final NotificationService notificationService;

    /**
     * Hàm sinh HTML Template Email dùng chung, đảm bảo tính thẩm mỹ, nhất quán và responsive
     */
    private String buildEmailTemplate(String fullName, String messageContent, String extraSection, String senderName) {
        return "<!DOCTYPE html>\n" +
                "<html>\n" +
                "<head>\n" +
                "    <meta charset=\"utf-8\">\n" +
                "    <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\n" +
                "    <style>\n" +
                "        body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f4f7f9; color: #333333; margin: 0; padding: 0; -webkit-font-smoothing: antialiased; }\n" +
                "        .container { max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 10px rgba(0,0,0,0.05); }\n" +
                "        .header { background: linear-gradient(135deg, #1e3a8a, #3b82f6); padding: 30px; text-align: center; color: #ffffff; }\n" +
                "        .header h1 { margin: 0; font-size: 24px; font-weight: 700; letter-spacing: 0.5px; }\n" +
                "        .content { padding: 40px 30px; line-height: 1.6; font-size: 15px; }\n" +
                "        .greeting { font-size: 17px; font-weight: 600; color: #1e293b; margin-bottom: 20px; }\n" +
                "        .message { color: #475569; margin-bottom: 30px; }\n" +
                "        .highlight-box { background-color: #f8fafc; border-left: 4px solid #3b82f6; padding: 15px; margin: 20px 0; border-radius: 0 4px 4px 0; font-size: 14px; }\n" +
                "        .highlight-item { margin: 8px 0; color: #334155; }\n" +
                "        .signature { border-top: 1px solid #e2e8f0; padding-top: 20px; color: #64748b; font-size: 14px; }\n" +
                "        .footer { background-color: #f8fafc; padding: 20px 30px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #f1f5f9; }\n" +
                "        .footer a { color: #3b82f6; text-decoration: none; }\n" +
                "    </style>\n" +
                "</head>\n" +
                "<body>\n" +
                "    <div class=\"container\">\n" +
                "        <div class=\"header\">\n" +
                "            <h1>HRMPro System</h1>\n" +
                "        </div>\n" +
                "        <div class=\"content\">\n" +
                "            <div class=\"greeting\">Kính gửi Anh/Chị " + fullName + ",</div>\n" +
                "            <div class=\"message\">\n" +
                "                " + messageContent + "\n" +
                "            </div>\n" +
                "            " + (extraSection != null ? extraSection : "") + "\n" +
                "            <div class=\"signature\">\n" +
                "                Trân trọng,<br><br>\n" +
                "                <strong>" + senderName + "</strong><br>\n" +
                "                Bộ phận Nhân sự & Phát triển Tổ chức | HRMPro\n" +
                "            </div>\n" +
                "        </div>\n" +
                "        <div class=\"footer\">\n" +
                "            Đây là thư điện tử tự động được gửi từ hệ thống Quản trị Nhân sự HRMPro.<br>\n" +
                "            Vui lòng không trả lời trực tiếp email này. Mọi thắc mắc xin liên hệ <a href=\"mailto:hr@hrmpro.com\">hr@hrmpro.com</a>.\n" +
                "        </div>\n" +
                "    </div>\n" +
                "</body>\n" +
                "</html>";
    }

    /**
     * Tác vụ 1: Chúc mừng sinh nhật & Kỷ niệm ngày làm việc
     * Chạy hàng ngày lúc 08:00 AM
     */
    @Scheduled(cron = "0 0 8 * * ?")
    @Transactional
    public void employeeBirthdayAndWorkAnniversaryJob() {
        log.info("Bắt đầu tác vụ kiểm tra sinh nhật và kỷ niệm ngày làm việc...");
        LocalDate today = LocalDate.now();
        int month = today.getMonthValue();
        int day = today.getDayOfMonth();

        // 1. Chúc mừng sinh nhật
        try {
            List<Employee> birthdayEmployees = employeeRepository.findActiveEmployeesByBirthday(month, day);
            log.info("Tìm thấy {} nhân viên có sinh nhật hôm nay.", birthdayEmployees.size());
            for (Employee emp : birthdayEmployees) {
                try {
                    // Tạo thông báo hệ thống
                    notificationService.createNotification(emp, "BIRTHDAY", "Chúc mừng sinh nhật!", "Chúc mừng sinh nhật " + emp.getFullName() + "! Chúc bạn tuổi mới nhiều sức khỏe, hạnh phúc và thành công trong công việc.", "/dashboard");

                    // Thiết kế email chúc mừng sinh nhật trang trọng
                    String messageContent = "Nhân cột mốc đón chào tuổi mới của Anh/Chị, thay mặt Ban Giám đốc và toàn thể đại gia đình HRMPro, chúng tôi xin gửi tới Anh/Chị lời chúc mừng chân thành và nồng nhiệt nhất.<br><br>" +
                            "Cảm ơn Anh/Chị đã và đang dành trọn nhiệt huyết, cống hiến sức lực của mình vào sự phát triển chung của công ty. Sự hiện diện và nỗ lực bền bỉ của Anh/Chị là một phần vô cùng quý giá cấu thành nên thành công của doanh nghiệp chúng ta.<br><br>" +
                            "Chúc Anh/Chị bước sang tuổi mới luôn tràn đầy năng lượng tích cực, dồi dào sức khỏe, hạnh phúc viên mãn bên gia đình và tiếp tục gặt hái thêm nhiều thành tựu rực rỡ hơn nữa trong sự nghiệp!";
                    
                    String htmlContent = buildEmailTemplate(emp.getFullName(), messageContent, null, "Ban Giám đốc & Phòng Nhân sự");
                    emailService.sendHtmlEmail(emp.getEmail(), "[HRMPro] Thư Chúc Mừng Sinh Nhật - Anh/Chị " + emp.getFullName(), htmlContent);
                } catch (Exception e) {
                    log.error("Lỗi khi xử lý chúc mừng sinh nhật cho nhân viên {}: {}", emp.getFullName(), e.getMessage());
                }
            }
        } catch (Exception e) {
            log.error("Lỗi khi quét sinh nhật nhân viên: {}", e.getMessage());
        }

        // 2. Kỷ niệm ngày vào làm (Thâm niên)
        try {
            List<Employee> anniversaryEmployees = employeeRepository.findActiveEmployeesByWorkAnniversary(month, day);
            log.info("Tìm thấy {} nhân viên có kỷ niệm ngày làm việc hôm nay.", anniversaryEmployees.size());
            for (Employee emp : anniversaryEmployees) {
                int yearsOfService = today.getYear() - emp.getHireDate().getYear();
                if (yearsOfService <= 0) {
                    continue; // Vừa vào làm năm nay, không cần chúc mừng thâm niên
                }
                try {
                    // Tạo thông báo hệ thống
                    notificationService.createNotification(emp, "WORK_ANNIVERSARY", "Kỷ niệm ngày làm việc!", String.format("Chúc mừng kỷ niệm %d năm đồng hành cùng công ty của %s! Cảm ơn những đóng góp to lớn của bạn.", yearsOfService, emp.getFullName()), "/dashboard");

                    // Thiết kế email kỷ niệm ngày vào làm
                    String messageContent = String.format(
                            "Hôm nay là một ngày đặc biệt đánh dấu cột mốc tròn <strong>%d năm</strong> Anh/Chị chính thức gia nhập và đồng hành cùng đại gia đình HRMPro.<br><br>" +
                            "Ban Giám đốc cùng toàn thể đội ngũ công ty xin gửi lời tri ân sâu sắc nhất tới Anh/Chị vì tinh thần trách nhiệm, sự cống hiến bền bỉ và những nỗ lực không ngừng nghỉ trong suốt thời gian qua. Sự gắn bó lâu dài của Anh/Chị là niềm tự hào và là bệ đỡ vững chắc cho hành trình phát triển của doanh nghiệp.<br><br>" +
                            "Chúc Anh/Chị luôn giữ vững ngọn lửa nhiệt huyết với nghề, có thật nhiều sức khỏe, niềm vui và tiếp tục cùng chúng tôi kiến tạo thêm nhiều cột mốc vinh quang mới trong tương lai!",
                            yearsOfService
                    );
                    
                    String htmlContent = buildEmailTemplate(emp.getFullName(), messageContent, null, "Ban Giám đốc HRMPro");
                    emailService.sendHtmlEmail(emp.getEmail(), String.format("[HRMPro] Thư Chúc Mừng Kỷ Niệm %d Năm Đồng Hành Cùng Doanh Nghiệp", yearsOfService), htmlContent);
                } catch (Exception e) {
                    log.error("Lỗi khi xử lý kỷ niệm thâm niên cho nhân viên {}: {}", emp.getFullName(), e.getMessage());
                }
            }
        } catch (Exception e) {
            log.error("Lỗi khi quét kỷ niệm ngày làm việc: {}", e.getMessage());
        }
    }

    /**
     * Tác vụ 2: Tự động đóng tin tuyển dụng quá hạn
     * Chạy hàng ngày lúc 00:00 AM
     */
    @Scheduled(cron = "0 0 0 * * ?")
    @Transactional
    public void closeExpiredJobPostingsJob() {
        log.info("Bắt đầu tác vụ đóng tin tuyển dụng quá hạn...");
        LocalDate today = LocalDate.now();
        try {
            List<JobPosting> expiredPostings = jobPostingRepository.findByStatusAndClosingDateBefore("OPEN", today);
            log.info("Tìm thấy {} tin tuyển dụng quá hạn cần đóng.", expiredPostings.size());
            for (JobPosting posting : expiredPostings) {
                posting.setStatus("CLOSED");
                jobPostingRepository.save(posting);
                log.info("Đã đóng tin tuyển dụng: {} (Hạn nộp: {})", posting.getTitle(), posting.getClosingDate());
            }
        } catch (Exception e) {
            log.error("Lỗi khi đóng tin tuyển dụng quá hạn: {}", e.getMessage());
        }
    }

    /**
     * Tác vụ 3: Cảnh báo hết hạn hợp đồng lao động
     * Chạy hàng ngày lúc 08:30 AM
     */
    @Scheduled(cron = "0 30 8 * * ?")
    @Transactional
    public void contractExpirationWarningJob() {
        log.info("Bắt đầu tác vụ cảnh báo hết hạn hợp đồng lao động...");
        LocalDate today = LocalDate.now();
        LocalDate date15 = today.plusDays(15);
        LocalDate date30 = today.plusDays(30);

        try {
            List<Contract> expiringContracts = contractRepository.findExpiringContracts(date15, date30);
            log.info("Tìm thấy {} hợp đồng sắp hết hạn (trong 15 hoặc 30 ngày tới).", expiringContracts.size());
            for (Contract contract : expiringContracts) {
                Employee emp = contract.getEmployee();
                if (emp == null) continue;
                
                long daysRemaining = Period.between(today, contract.getEndDate()).getDays();
                LocalDate warningDateLimit = contract.getEndDate().minusDays(5); // Cần xử lý trước ngày hết hạn 5 ngày
                try {
                    // 1. Gửi thông báo & email cho Nhân viên
                    notificationService.createNotification(emp, "CONTRACT_EXPIRING", "Hợp đồng lao động sắp hết hạn", String.format("Hợp đồng lao động số %s của bạn sẽ hết hạn vào ngày %s (còn %d ngày). Vui lòng liên hệ phòng Nhân sự để làm thủ tục tái ký hoặc bàn giao.", contract.getContractNumber(), contract.getEndDate(), daysRemaining), "/profile");

                    String empMessage = "Bộ phận Nhân sự HRMPro xin trân trọng thông báo hợp đồng lao động hiện tại của Anh/Chị chuẩn bị hết thời hạn hiệu lực. Kính đề nghị Anh/Chị rà soát lại chi tiết thông tin hợp đồng cụ thể dưới đây:";
                    
                    String empExtra = String.format(
                            "<div class=\"highlight-box\">\n" +
                            "    <div class=\"highlight-item\"><strong>Mã nhân viên:</strong> %s</div>\n" +
                            "    <div class=\"highlight-item\"><strong>Số hợp đồng:</strong> %s</div>\n" +
                            "    <div class=\"highlight-item\"><strong>Loại hợp đồng:</strong> %s</div>\n" +
                            "    <div class=\"highlight-item\"><strong>Ngày hết hạn:</strong> %s</div>\n" +
                            "    <div class=\"highlight-item\"><strong>Thời gian còn lại:</strong> <span style=\"color: #ef4444; font-weight: bold;\">%d ngày</span></div>\n" +
                            "</div>\n" +
                            "<p>Để đảm bảo quyền lợi cá nhân và duy trì hoạt động nghiệp vụ liên tục, kính đề nghị Anh/Chị sắp xếp thời gian liên hệ trực tiếp với Phòng Nhân sự trước ngày <strong>%s</strong> để thực hiện thủ tục đánh giá hiệu quả công việc và trao đổi về phương án tái ký hợp đồng lao động mới hoặc tiến hành các thủ tục liên quan theo quy định.</p>",
                            emp.getEmployeeCode(), contract.getContractNumber(), contract.getContractType(), contract.getEndDate(), daysRemaining, warningDateLimit
                    );

                    String empHtml = buildEmailTemplate(emp.getFullName(), empMessage, empExtra, "Phòng Nhân sự");
                    emailService.sendHtmlEmail(emp.getEmail(), "[HRMPro] Thông Báo Về Việc Hết Hạn Hợp Đồng Lao Động", empHtml);

                    // 2. Gửi thông báo cho Quản lý trực tiếp (nếu có)
                    Employee manager = emp.getManager();
                    if (manager != null) {
                        notificationService.createNotification(manager, "CONTRACT_EXPIRING", "Hợp đồng của nhân viên sắp hết hạn", String.format("Hợp đồng của nhân viên cấp dưới %s (Mã: %s) sẽ hết hạn vào ngày %s. Vui lòng thảo luận kế hoạch nhân sự tiếp theo.", emp.getFullName(), emp.getEmployeeCode(), contract.getEndDate()), "/dashboard");

                        String managerMessage = String.format(
                                "Bộ phận Nhân sự xin thông báo đến Anh/Chị thông tin về việc hợp đồng lao động của nhân viên trực thuộc quyền quản lý của Anh/Chị chuẩn bị hết thời hạn hiệu lực. Chi tiết nhân sự cụ thể như sau:"
                        );

                        String managerExtra = String.format(
                                "<div class=\"highlight-box\">\n" +
                                "    <div class=\"highlight-item\"><strong>Họ và tên nhân viên:</strong> %s</div>\n" +
                                "    <div class=\"highlight-item\"><strong>Mã nhân viên:</strong> %s</div>\n" +
                                "    <div class=\"highlight-item\"><strong>Số hợp đồng:</strong> %s</div>\n" +
                                "    <div class=\"highlight-item\"><strong>Ngày hết hạn:</strong> %s (còn lại %d ngày)</div>\n" +
                                "</div>\n" +
                                "<p>Kính đề nghị Anh/Chị với vai trò Cấp quản lý trực tiếp sắp xếp thời gian trao đổi với nhân viên về định hướng công việc tiếp theo, đồng thời gửi phản hồi về ý kiến đánh giá nhân sự và đề xuất phương án xử lý (Tái ký/Không tái ký) cho Phòng Nhân sự trước ngày <strong>%s</strong> để bộ phận HR tiến hành các thủ tục theo quy chế.</p>",
                                emp.getFullName(), emp.getEmployeeCode(), contract.getContractNumber(), contract.getEndDate(), daysRemaining, warningDateLimit
                        );

                        String managerHtml = buildEmailTemplate(manager.getFullName(), managerMessage, managerExtra, "Phòng Nhân sự");
                        emailService.sendHtmlEmail(manager.getEmail(), "[HRMPro] Thông Báo Nhân Sự Thuộc Quyền Quản Lý Sắp Hết Hạn Hợp Đồng Lao Động", managerHtml);
                    }
                } catch (Exception e) {
                    log.error("Lỗi khi xử lý cảnh báo hợp đồng cho nhân viên {}: {}", emp.getFullName(), e.getMessage());
                }
            }
        } catch (Exception e) {
            log.error("Lỗi khi quét hợp đồng sắp hết hạn: {}", e.getMessage());
        }
    }

    /**
     * Tác vụ 4a: Khởi tạo phép năm mới hàng năm cho nhân viên ACTIVE
     * Chạy ngày 1 tháng 1 hàng năm lúc 00:00 AM
     */
    @Scheduled(cron = "0 0 0 1 1 ?")
    @Transactional
    public void initializeNewYearLeaveBalanceJob() {
        log.info("Bắt đầu tác vụ khởi tạo số dư phép năm mới...");
        int currentYear = LocalDate.now().getYear();
        try {
            Optional<LeaveType> annualLeaveTypeOpt = leaveTypeRepository.findByCode("ANNUAL");
            if (annualLeaveTypeOpt.isEmpty()) {
                log.warn("Không tìm thấy loại phép ANNUAL trong hệ thống. Không thể khởi tạo phép năm.");
                return;
            }
            LeaveType annualLeaveType = annualLeaveTypeOpt.get();
            List<Employee> activeEmployees = employeeRepository.findAllByStatus("ACTIVE");

            log.info("Khởi tạo phép năm {} cho {} nhân viên ACTIVE.", currentYear, activeEmployees.size());
            for (Employee emp : activeEmployees) {
                try {
                    Optional<LeaveBalance> existingBalance = leaveBalanceRepository
                            .findByEmployeeIdAndLeaveTypeIdAndYear(emp.getId(), annualLeaveType.getId(), currentYear);

                    if (existingBalance.isEmpty()) {
                        // Cap số ngày phép ở mức tối đa 16 ngày
                        BigDecimal totalDays = annualLeaveType.getDaysPerYear();
                        if (totalDays.compareTo(MAX_ANNUAL_LEAVE_DAYS) > 0) {
                            totalDays = MAX_ANNUAL_LEAVE_DAYS;
                        }

                        LeaveBalance newBalance = LeaveBalance.builder()
                                .employee(emp)
                                .leaveType(annualLeaveType)
                                .year(currentYear)
                                .totalDays(totalDays)
                                .usedDays(BigDecimal.ZERO)
                                .pendingDays(BigDecimal.ZERO)
                                .build();
                        leaveBalanceRepository.save(newBalance);
                        log.info("Đã khởi tạo phép năm cho: {} - {} ngày (giới hạn tối đa: 16 ngày)", emp.getFullName(), totalDays);
                    }
                } catch (Exception e) {
                    log.error("Lỗi khi khởi tạo phép cho nhân viên {}: {}", emp.getFullName(), e.getMessage());
                }
            }
        } catch (Exception e) {
            log.error("Lỗi khi chạy job khởi tạo phép năm mới: {}", e.getMessage());
        }
    }

    /**
     * Tác vụ 4b: Cập nhật phép thâm niên hàng tháng
     * Chạy ngày 1 hàng tháng lúc 00:00 AM
     */
    @Scheduled(cron = "0 0 0 1 * ?")
    @Transactional
    public void updateSeniorityLeaveBalanceJob() {
        log.info("Bắt đầu tác vụ cập nhật phép thâm niên hàng tháng...");
        LocalDate today = LocalDate.now();
        int currentYear = today.getYear();

        try {
            Optional<LeaveType> annualLeaveTypeOpt = leaveTypeRepository.findByCode("ANNUAL");
            if (annualLeaveTypeOpt.isEmpty()) {
                log.warn("Không tìm thấy loại phép ANNUAL trong hệ thống.");
                return;
            }
            LeaveType annualLeaveType = annualLeaveTypeOpt.get();
            List<Employee> activeEmployees = employeeRepository.findAllByStatus("ACTIVE");

            for (Employee emp : activeEmployees) {
                if (emp.getHireDate() == null) continue;
                
                int yearsOfService = Period.between(emp.getHireDate(), today).getYears();
                int seniorityDaysBonus = yearsOfService / 5; // Cứ 5 năm làm việc được cộng thêm 1 ngày phép
                
                if (seniorityDaysBonus > 0) {
                    try {
                        Optional<LeaveBalance> balanceOpt = leaveBalanceRepository
                                .findByEmployeeIdAndLeaveTypeIdAndYear(emp.getId(), annualLeaveType.getId(), currentYear);

                        LeaveBalance balance;
                        if (balanceOpt.isPresent()) {
                            balance = balanceOpt.get();
                            BigDecimal defaultDays = annualLeaveType.getDaysPerYear() != null ? annualLeaveType.getDaysPerYear() : new BigDecimal("12.0");
                            BigDecimal newTotalDays = defaultDays.add(new BigDecimal(seniorityDaysBonus));

                            // Áp dụng giới hạn tối đa 16 ngày
                            if (newTotalDays.compareTo(MAX_ANNUAL_LEAVE_DAYS) > 0) {
                                newTotalDays = MAX_ANNUAL_LEAVE_DAYS;
                                log.info("Phép thâm niên cho {} đã đạt giới hạn tối đa 16 ngày (thâm niên {} năm)",
                                        emp.getFullName(), yearsOfService);
                            }

                            // Nếu số ngày phép hiện tại khác số ngày được tính mới (bao gồm thâm niên) thì cập nhật
                            if (balance.getTotalDays().compareTo(newTotalDays) != 0) {
                                balance.setTotalDays(newTotalDays);
                                leaveBalanceRepository.save(balance);
                                log.info("Cập nhật phép thâm niên cho {}: Thâm niên {} năm -> Tổng ngày phép: {}",
                                        emp.getFullName(), yearsOfService, newTotalDays);
                            }
                        } else {
                            // Tạo mới nếu chưa có
                            BigDecimal defaultDays = annualLeaveType.getDaysPerYear() != null ? annualLeaveType.getDaysPerYear() : new BigDecimal("12.0");
                            BigDecimal newTotalDays = defaultDays.add(new BigDecimal(seniorityDaysBonus));

                            // Áp dụng giới hạn tối đa 16 ngày
                            if (newTotalDays.compareTo(MAX_ANNUAL_LEAVE_DAYS) > 0) {
                                newTotalDays = MAX_ANNUAL_LEAVE_DAYS;
                            }

                            balance = LeaveBalance.builder()
                                    .employee(emp)
                                    .leaveType(annualLeaveType)
                                    .year(currentYear)
                                    .totalDays(newTotalDays)
                                    .usedDays(BigDecimal.ZERO)
                                    .pendingDays(BigDecimal.ZERO)
                                    .build();
                            leaveBalanceRepository.save(balance);
                            log.info("Tạo mới số dư phép có thâm niên cho {}: Thâm niên {} năm -> Tổng ngày phép: {} (giới hạn: 16)",
                                    emp.getFullName(), yearsOfService, newTotalDays);
                        }
                    } catch (Exception e) {
                        log.error("Lỗi khi cập nhật phép thâm niên cho nhân viên {}: {}", emp.getFullName(), e.getMessage());
                    }
                }
            }
        } catch (Exception e) {
            log.error("Lỗi khi cập nhật phép thâm niên: {}", e.getMessage());
        }
    }
}
