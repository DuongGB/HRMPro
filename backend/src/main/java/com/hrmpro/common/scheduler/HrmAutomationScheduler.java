package com.hrmpro.common.scheduler;

import com.hrmpro.common.service.EmailService;
import com.hrmpro.module.employee.entity.Contract;
import com.hrmpro.module.employee.entity.Employee;
import com.hrmpro.module.employee.entity.Notification;
import com.hrmpro.module.employee.repository.ContractRepository;
import com.hrmpro.module.employee.repository.EmployeeRepository;
import com.hrmpro.module.employee.repository.NotificationRepository;
import com.hrmpro.module.leave.entity.LeaveBalance;
import com.hrmpro.module.leave.entity.LeaveType;
import com.hrmpro.module.leave.repository.LeaveBalanceRepository;
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

    private final EmployeeRepository employeeRepository;
    private final NotificationRepository notificationRepository;
    private final JobPostingRepository jobPostingRepository;
    private final ContractRepository contractRepository;
    private final LeaveBalanceRepository leaveBalanceRepository;
    private final LeaveTypeRepository leaveTypeRepository;
    private final EmailService emailService;

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
                    Notification notification = Notification.builder()
                            .recipient(emp)
                            .type("BIRTHDAY")
                            .title("Chúc mừng sinh nhật!")
                            .message("Chúc mừng sinh nhật " + emp.getFullName() + "! Chúc bạn tuổi mới nhiều sức khỏe, hạnh phúc và thành công trong công việc.")
                            .isRead(false)
                            .relatedUrl("/dashboard")
                            .createdAt(LocalDateTime.now())
                            .build();
                    notificationRepository.save(notification);

                    // Gửi email
                    String emailContent = String.format(
                            "Thân gửi %s,\n\n" +
                            "Thay mặt Ban Giám Đốc và toàn thể nhân viên HRMPro, xin chúc mừng sinh nhật bạn!\n" +
                            "Chúc bạn bước sang tuổi mới có thật nhiều niềm vui, sức khỏe dồi dào, luôn tràn đầy năng lượng và gặt hái thêm nhiều thành công mới trong sự nghiệp tại công ty.\n\n" +
                            "Trân trọng,\n" +
                            "Bộ phận Nhân sự HRMPro",
                            emp.getFullName()
                    );
                    emailService.sendEmail(emp.getEmail(), "Chúc Mừng Sinh Nhật - HRMPro", emailContent);
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
                    Notification notification = Notification.builder()
                            .recipient(emp)
                            .type("WORK_ANNIVERSARY")
                            .title("Kỷ niệm ngày làm việc!")
                            .message(String.format("Chúc mừng kỷ niệm %d năm đồng hành cùng công ty của %s! Cảm ơn những đóng góp to lớn của bạn.", yearsOfService, emp.getFullName()))
                            .isRead(false)
                            .relatedUrl("/dashboard")
                            .createdAt(LocalDateTime.now())
                            .build();
                    notificationRepository.save(notification);

                    // Gửi email
                    String emailContent = String.format(
                            "Thân gửi %s,\n\n" +
                            "Hôm nay đánh dấu tròn %d năm bạn đồng hành cùng đại gia đình HRMPro!\n" +
                            "Công ty vô cùng trân trọng sự nỗ lực, cống hiến và những đóng góp bền bỉ của bạn trong suốt thời gian qua. Sự đồng hành của bạn chính là một trong những viên gạch vững chắc xây dựng nên thành công của chúng ta ngày hôm nay.\n" +
                            "Chúc bạn luôn giữ vững ngọn lửa nhiệt huyết, gặt hái được nhiều cột mốc ý nghĩa hơn nữa cùng công ty.\n\n" +
                            "Trân trọng,\n" +
                            "Ban Giám Đốc HRMPro",
                            emp.getFullName(), yearsOfService
                    );
                    emailService.sendEmail(emp.getEmail(), "Chúc Mừng Kỷ Niệm Ngày Làm Việc - HRMPro", emailContent);
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
                try {
                    // 1. Gửi thông báo & email cho Nhân viên
                    Notification empNotification = Notification.builder()
                            .recipient(emp)
                            .type("CONTRACT_EXPIRING")
                            .title("Hợp đồng lao động sắp hết hạn")
                            .message(String.format("Hợp đồng lao động số %s của bạn sẽ hết hạn vào ngày %s (còn %d ngày). Vui lòng liên hệ phòng Nhân sự để làm thủ tục tái ký hoặc bàn giao.",
                                    contract.getContractNumber(), contract.getEndDate(), daysRemaining))
                            .isRead(false)
                            .relatedUrl("/profile")
                            .createdAt(LocalDateTime.now())
                            .build();
                    notificationRepository.save(empNotification);

                    String empEmailContent = String.format(
                            "Thân gửi %s,\n\n" +
                            "Hệ thống HRMPro xin thông báo hợp đồng lao động số %s của bạn (loại: %s) sẽ hết hạn vào ngày %s (còn lại %d ngày).\n" +
                            "Vui lòng liên hệ phòng Nhân sự để được hướng dẫn các thủ tục tiếp theo liên quan đến việc tái ký hợp đồng hoặc bàn giao công việc.\n\n" +
                            "Trân trọng,\n" +
                            "Bộ phận Nhân sự HRMPro",
                            emp.getFullName(), contract.getContractNumber(), contract.getContractType(), contract.getEndDate(), daysRemaining
                    );
                    emailService.sendEmail(emp.getEmail(), "Cảnh Báo Hết Hạn Hợp Đồng Lao Động - HRMPro", empEmailContent);

                    // 2. Gửi thông báo cho Quản lý trực tiếp (nếu có)
                    Employee manager = emp.getManager();
                    if (manager != null) {
                        Notification managerNotification = Notification.builder()
                                .recipient(manager)
                                .type("CONTRACT_EXPIRING")
                                .title("Hợp đồng của nhân viên sắp hết hạn")
                                .message(String.format("Hợp đồng của nhân viên cấp dưới %s (Mã: %s) sẽ hết hạn vào ngày %s. Vui lòng thảo luận kế hoạch nhân sự tiếp theo.",
                                        emp.getFullName(), emp.getEmployeeCode(), contract.getEndDate()))
                                .isRead(false)
                                .relatedUrl("/dashboard")
                                .createdAt(LocalDateTime.now())
                                .build();
                        notificationRepository.save(managerNotification);

                        String managerEmailContent = String.format(
                                "Thân gửi Quản lý %s,\n\n" +
                                "Hệ thống HRMPro xin thông báo hợp đồng lao động của nhân viên cấp dưới trực tiếp của bạn:\n" +
                                "- Nhân viên: %s (Mã NV: %s)\n" +
                                "- Hợp đồng số: %s\n" +
                                "- Ngày hết hạn: %s (còn lại %d ngày)\n\n" +
                                "Vui lòng làm việc với nhân viên và bộ phận Nhân sự về kế hoạch tái ký hợp đồng hoặc bàn giao nhân sự.\n\n" +
                                "Trân trọng,\n" +
                                "Hệ thống HRMPro",
                                manager.getFullName(), emp.getFullName(), emp.getEmployeeCode(), contract.getContractNumber(), contract.getEndDate(), daysRemaining
                        );
                        emailService.sendEmail(manager.getEmail(), "Cảnh Báo Hết Hạn Hợp Đồng Nhân Viên Cấp Dưới - HRMPro", managerEmailContent);
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
                        LeaveBalance newBalance = LeaveBalance.builder()
                                .employee(emp)
                                .leaveType(annualLeaveType)
                                .year(currentYear)
                                .totalDays(annualLeaveType.getDaysPerYear())
                                .usedDays(BigDecimal.ZERO)
                                .pendingDays(BigDecimal.ZERO)
                                .build();
                        leaveBalanceRepository.save(newBalance);
                        log.info("Đã khởi tạo phép năm cho: {} - {} ngày", emp.getFullName(), annualLeaveType.getDaysPerYear());
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
                            balance = LeaveBalance.builder()
                                    .employee(emp)
                                    .leaveType(annualLeaveType)
                                    .year(currentYear)
                                    .totalDays(newTotalDays)
                                    .usedDays(BigDecimal.ZERO)
                                    .pendingDays(BigDecimal.ZERO)
                                    .build();
                            leaveBalanceRepository.save(balance);
                            log.info("Tạo mới số dư phép có thâm niên cho {}: Thâm niên {} năm -> Tổng ngày phép: {}", 
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
