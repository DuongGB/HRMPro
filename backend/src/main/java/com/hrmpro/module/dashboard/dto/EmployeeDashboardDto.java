package com.hrmpro.module.dashboard.dto;

import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EmployeeDashboardDto {

    // Leave Balance Summary
    private BigDecimal totalLeaveDays;
    private BigDecimal usedLeaveDays;
    private BigDecimal remainingLeaveDays;

    // Attendance Summary (tháng hiện tại)
    private Integer currentMonthWorkDays;
    private Integer currentMonthLateCount;
    private Integer currentMonthAbsentCount;
    private Integer standardWorkDays;

    // Latest Payslip
    private LatestPayslipSummary latestPayslip;

    // Pending Requests Count
    private Long pendingLeaveRequests;
    private Long pendingAttendanceAdjustments;

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class LatestPayslipSummary {
        private Long id;
        private Integer year;
        private Integer month;
        private BigDecimal netSalary;
        private String pdfUrl;
    }
}
