package com.hrmpro.module.auth.repository;

import com.hrmpro.module.auth.entity.AuditLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;

@Repository
public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {
    int deleteByCreatedAtBefore(LocalDateTime date);
}
