package com.hrmpro.common.scheduler;

import com.hrmpro.module.auth.repository.AuditLogRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Component
@RequiredArgsConstructor
@Slf4j
public class AuditLogCleanupScheduler {

    private final AuditLogRepository auditLogRepository;

    @Value("${app.audit-log.retention-days:90}")
    private int retentionDays;

    /**
     * Chạy định kỳ vào 2:00 sáng hàng ngày để dọn dẹp log cũ
     */
    @Scheduled(cron = "0 0 2 * * ?")
    @Transactional
    public void cleanupOldLogs() {
        log.info("Bắt đầu tiến trình dọn dẹp Audit Log cũ...");
        
        LocalDateTime cutoffDate = LocalDateTime.now().minusDays(retentionDays);
        try {
            int deletedCount = auditLogRepository.deleteByCreatedAtBefore(cutoffDate);
            log.info("Đã dọn dẹp thành công {} bản ghi Audit Log cũ hơn ngày {}", deletedCount, cutoffDate);
        } catch (Exception e) {
            log.error("Lỗi xảy ra trong quá trình dọn dẹp Audit Log: {}", e.getMessage());
        }
    }
}
