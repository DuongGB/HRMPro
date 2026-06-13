package com.hrmpro.module.performance.dto;

import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PerformanceReviewDto {
    private Long id;
    private Long cycleId;
    private String cycleName;
    private Long employeeId;
    private String employeeCode;
    private String employeeName;
    private String departmentName;
    private Long reviewerId;
    private String reviewerName;
    private BigDecimal selfScore;
    private BigDecimal reviewerScore;
    private BigDecimal finalScore;
    private String rating; // EXCELLENT|GOOD|MEETS|BELOW|POOR
    private String strengths;
    private String improvements;
    private String goalsNext;
    private String status; // PENDING|SELF_EVALUATING|MANAGER_EVALUATING|COMPLETED
    private LocalDateTime completedAt;
    private List<KpiRecordDto> kpis;
}
