package com.hrmpro.common.scheduler;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/automation")
@RequiredArgsConstructor
@PreAuthorize("hasRole('SUPER_ADMIN')")
public class AutomationTestController {

    private final HrmAutomationScheduler hrmAutomationScheduler;

    @GetMapping("/birthday-anniversary")
    public ResponseEntity<?> triggerBirthdayAnniversaryJob() {
        hrmAutomationScheduler.employeeBirthdayAndWorkAnniversaryJob();
        return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Đã kích hoạt thủ công tác vụ kiểm tra sinh nhật và kỷ niệm ngày làm việc."
        ));
    }

    @GetMapping("/close-expired-jobs")
    public ResponseEntity<?> triggerCloseExpiredJobsJob() {
        hrmAutomationScheduler.closeExpiredJobPostingsJob();
        return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Đã kích hoạt thủ công tác vụ đóng tin tuyển dụng quá hạn."
        ));
    }

    @GetMapping("/contract-warning")
    public ResponseEntity<?> triggerContractWarningJob() {
        hrmAutomationScheduler.contractExpirationWarningJob();
        return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Đã kích hoạt thủ công tác vụ cảnh báo hết hạn hợp đồng lao động."
        ));
    }

    @GetMapping("/leave-init")
    public ResponseEntity<?> triggerLeaveInitJob() {
        hrmAutomationScheduler.initializeNewYearLeaveBalanceJob();
        return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Đã kích hoạt thủ công tác vụ khởi tạo số dư phép năm mới."
        ));
    }

    @GetMapping("/leave-seniority")
    public ResponseEntity<?> triggerLeaveSeniorityJob() {
        hrmAutomationScheduler.updateSeniorityLeaveBalanceJob();
        return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Đã kích hoạt thủ công tác vụ cập nhật phép thâm niên."
        ));
    }
}
