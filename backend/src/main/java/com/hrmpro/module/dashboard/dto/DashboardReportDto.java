package com.hrmpro.module.dashboard.dto;

import lombok.*;

import java.math.BigDecimal;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DashboardReportDto {

    private List<DeptHeadcount> deptHeadcounts;
    private List<MonthlyPayroll> monthlyPayrolls;
    private List<DeptAttendanceStats> deptAttendanceStats;
    private List<RecruitmentFunnel> recruitmentFunnels;
    private List<RecruitmentSource> recruitmentSources;

    // Tổng số lượng
    private Long totalEmployees;
    private Long activeJobs;
    private Long totalApplications;
    private BigDecimal currentMonthPayrollCost;
    private Double turnoverRate; // % tỉ lệ nghỉ việc trong năm

    @Getter
    @Setter
    @AllArgsConstructor
    @NoArgsConstructor
    @Builder
    public static class DeptHeadcount {
        private String departmentName;
        private Long headcount;
    }

    @Getter
    @Setter
    @AllArgsConstructor
    @NoArgsConstructor
    @Builder
    public static class MonthlyPayroll {
        private String monthYear; // "05/2026"
        private BigDecimal totalCost;
    }

    @Getter
    @Setter
    @AllArgsConstructor
    @NoArgsConstructor
    @Builder
    public static class DeptAttendanceStats {
        private String employeeName;
        private Long lateCount;
        private Long absentCount;
    }

    @Getter
    @Setter
    @AllArgsConstructor
    @NoArgsConstructor
    @Builder
    public static class RecruitmentFunnel {
        private String stage; // NEW, SCREENING, INTERVIEW, OFFER, HIRED
        private String stageLabel; // "Hồ sơ mới", "Sàng lọc"...
        private Long count;
    }

    @Getter
    @Setter
    @AllArgsConstructor
    @NoArgsConstructor
    @Builder
    public static class RecruitmentSource {
        private String source;
        private Long count;
    }
}
