package com.hrmpro.module.auth.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "audit_logs")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AuditLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String username;

    @Column(length = 100)
    private String action;

    @Column(nullable = false, length = 10)
    private String method;

    @Column(name = "request_uri", nullable = false, length = 255)
    private String requestUri;

    @Column(name = "ip_address", length = 45)
    private String ipAddress;

    private Integer status;

    @Column(columnDefinition = "TEXT")
    private String payload;

    @Column(name = "created_at")
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
}
