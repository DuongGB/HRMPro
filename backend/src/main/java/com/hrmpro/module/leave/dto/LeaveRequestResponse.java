package com.hrmpro.module.leave.dto;

import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LeaveRequestResponse {
    private Long id;
    private Long employeeId;
    private String employeeCode;
    private String employeeName;
    private Long leaveTypeId;
    private String leaveTypeCode;
    private String leaveTypeName;
    private LocalDate startDate;
    private LocalDate endDate;
    private BigDecimal totalDays;
    private String reason;
    private String status; // PENDING|APPROVED|REJECTED|CANCELLED
    private Long managerId;
    private String managerName;
    private String managerNote;
    private LocalDateTime reviewedAt;
    private String attachmentUrl;
    private LocalDateTime createdAt;
}
