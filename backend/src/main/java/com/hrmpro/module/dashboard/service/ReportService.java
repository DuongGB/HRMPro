package com.hrmpro.module.dashboard.service;

import com.hrmpro.module.attendance.entity.AttendanceSummary;
import com.hrmpro.module.attendance.repository.AttendanceSummaryRepository;
import com.hrmpro.module.dashboard.dto.DashboardReportDto;
import com.hrmpro.module.dashboard.dto.EmployeeDashboardDto;
import com.hrmpro.module.employee.repository.EmployeeRepository;
import com.hrmpro.module.leave.repository.LeaveRequestRepository;
import com.hrmpro.module.payroll.entity.Payslip;
import com.hrmpro.module.payroll.repository.PayrollRunRepository;
import com.hrmpro.module.payroll.repository.PayslipRepository;
import com.hrmpro.module.recruitment.repository.ApplicationRepository;
import com.hrmpro.module.recruitment.repository.JobPostingRepository;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class ReportService {

    private final EmployeeRepository employeeRepository;
    private final JobPostingRepository jobPostingRepository;
    private final ApplicationRepository applicationRepository;
    private final PayslipRepository payslipRepository;
    private final PayrollRunRepository payrollRunRepository;
    private final LeaveRequestRepository leaveRequestRepository;
    private final AttendanceSummaryRepository attendanceSummaryRepository;

    @PersistenceContext
    private EntityManager entityManager;

    public DashboardReportDto getDashboardReport(Long employeeId, List<String> roles) {
        boolean isHROrAdmin = roles.stream().anyMatch(r -> r.equals("ROLE_SUPER_ADMIN") || r.equals("ROLE_HR_ADMIN") || r.equals("ROLE_HR_STAFF"));
        boolean isManager = roles.contains("ROLE_MANAGER");

        DashboardReportDto.DashboardReportDtoBuilder builder = DashboardReportDto.builder();

        // 1. Thống kê chung (Cards)
        long totalEmp = employeeRepository.findAll().stream()
                .filter(e -> "ACTIVE".equals(e.getStatus()) || "PROBATION".equals(e.getStatus()))
                .count();
        builder.totalEmployees(totalEmp);

        long activeJobs = jobPostingRepository.findByStatus("OPEN").size();
        builder.activeJobs(activeJobs);

        long totalApps = applicationRepository.count();
        builder.totalApplications(totalApps);

        // Chi phí quỹ lương tháng gần nhất
        BigDecimal latestPayrollCost = entityManager.createQuery(
                "SELECT COALESCE(SUM(p.netSalary), 0) FROM Payslip p WHERE p.payrollRun.status = 'PUBLISHED'", BigDecimal.class)
                .getSingleResult();
        builder.currentMonthPayrollCost(latestPayrollCost);

        // Tỷ lệ nghỉ việc trong năm (turnover rate) mock hoặc tính toán dựa trên ngày termination
        builder.turnoverRate(4.2); 

        // 2. Thống kê Headcount phòng ban (Cho HR/Admin)
        if (isHROrAdmin) {
            List<Object[]> headcounts = entityManager.createQuery(
                    "SELECT COALESCE(e.department.name, 'Chưa gán'), COUNT(e) FROM Employee e " +
                    "WHERE e.status = 'ACTIVE' OR e.status = 'PROBATION' " +
                    "GROUP BY e.department.name", Object[].class)
                    .getResultList();

            List<DashboardReportDto.DeptHeadcount> list = new ArrayList<>();
            for (Object[] hc : headcounts) {
                list.add(new DashboardReportDto.DeptHeadcount((String) hc[0], (Long) hc[1]));
            }
            builder.deptHeadcounts(list);

            // Thống kê quỹ lương theo tháng (Cost Trend)
            List<Object[]> monthlyCosts = entityManager.createQuery(
                    "SELECT CONCAT(r.month, '/', r.year), SUM(p.netSalary) FROM Payslip p " +
                    "JOIN p.payrollRun r " +
                    "WHERE r.status = 'PUBLISHED' " +
                    "GROUP BY r.id, r.month, r.year " +
                    "ORDER BY r.year ASC, r.month ASC", Object[].class)
                    .getResultList();

            List<DashboardReportDto.MonthlyPayroll> payrolls = new ArrayList<>();
            for (Object[] mc : monthlyCosts) {
                payrolls.add(new DashboardReportDto.MonthlyPayroll((String) mc[0], (BigDecimal) mc[1]));
            }
            builder.monthlyPayrolls(payrolls);
        }

        // 3. Thống kê Chấm công phòng ban (Cho Manager)
        if (isManager) {
            // Lấy 5 nhân viên đi muộn / vắng nhiều nhất trong tháng hiện hành thuộc phòng ban của manager
            List<Object[]> attendanceStats = entityManager.createQuery(
                    "SELECT e.lastName || ' ' || e.firstName, SUM(s.lateCount), SUM(s.absentCount) FROM AttendanceSummary s " +
                    "JOIN s.employee e " +
                    "WHERE e.manager.id = :managerId AND s.year = :year AND s.month = :month " +
                    "GROUP BY e.id, e.lastName, e.firstName " +
                    "ORDER BY SUM(s.lateCount) DESC, SUM(s.absentCount) DESC", Object[].class)
                    .setParameter("managerId", employeeId)
                    .setParameter("year", LocalDate.now().getYear())
                    .setParameter("month", LocalDate.now().getMonthValue())
                    .setMaxResults(5)
                    .getResultList();

            List<DashboardReportDto.DeptAttendanceStats> stats = new ArrayList<>();
            for (Object[] row : attendanceStats) {
                stats.add(new DashboardReportDto.DeptAttendanceStats((String) row[0], (Long) row[1], (Long) row[2]));
            }
            builder.deptAttendanceStats(stats);
        }

        // 4. Thống kê phễu tuyển dụng & nguồn (Cho Recruiter/HR)
        boolean isRecruiter = roles.contains("ROLE_RECRUITER");
        if (isHROrAdmin || isRecruiter) {
            List<Object[]> funnel = entityManager.createQuery(
                    "SELECT a.stage, COUNT(a) FROM Application a GROUP BY a.stage", Object[].class)
                    .getResultList();

            List<DashboardReportDto.RecruitmentFunnel> funnelList = new ArrayList<>();
            for (Object[] row : funnel) {
                String stage = (String) row[0];
                String label = stage;
                if ("NEW".equals(stage)) label = "Mới";
                else if ("SCREENING".equals(stage)) label = "Sàng lọc CV";
                else if ("INTERVIEW".equals(stage)) label = "Phỏng vấn";
                else if ("OFFER".equals(stage)) label = "Gửi Offer";
                else if ("HIRED".equals(stage)) label = "Đã tuyển";
                else if ("REJECTED".equals(stage)) label = "Từ chối";

                funnelList.add(new DashboardReportDto.RecruitmentFunnel(stage, label, (Long) row[1]));
            }
            builder.recruitmentFunnels(funnelList);

            List<Object[]> sources = entityManager.createQuery(
                    "SELECT COALESCE(a.source, 'Khác'), COUNT(a) FROM Application a GROUP BY a.source", Object[].class)
                    .getResultList();

            List<DashboardReportDto.RecruitmentSource> sourceList = new ArrayList<>();
            for (Object[] row : sources) {
                sourceList.add(new DashboardReportDto.RecruitmentSource((String) row[0], (Long) row[1]));
            }
            builder.recruitmentSources(sourceList);
        }

        return builder.build();
    }

    /**
     * Lấy dashboard dữ liệu cho Employee
     */
    public EmployeeDashboardDto getEmployeeDashboard(Long employeeId) {
        if (employeeId == null) {
            return EmployeeDashboardDto.builder().build();
        }

        EmployeeDashboardDto.EmployeeDashboardDtoBuilder builder = EmployeeDashboardDto.builder();

        // 1. Leave Balance Summary (tổng hợp tất cả các loại phép)
        List<Object[]> leaveBalances = entityManager.createQuery(
                "SELECT COALESCE(SUM(lb.totalDays), 0), COALESCE(SUM(lb.usedDays), 0), COALESCE(SUM(lb.remainingDays), 0) " +
                "FROM LeaveBalance lb WHERE lb.employee.id = :employeeId AND lb.year = :year", Object[].class)
                .setParameter("employeeId", employeeId)
                .setParameter("year", LocalDate.now().getYear())
                .getResultList();

        if (!leaveBalances.isEmpty()) {
            Object[] lb = leaveBalances.get(0);
            builder.totalLeaveDays((BigDecimal) lb[0]);
            builder.usedLeaveDays((BigDecimal) lb[1]);
            builder.remainingLeaveDays((BigDecimal) lb[2]);
        } else {
            builder.totalLeaveDays(BigDecimal.ZERO);
            builder.usedLeaveDays(BigDecimal.ZERO);
            builder.remainingLeaveDays(BigDecimal.ZERO);
        }

        // 2. Attendance Summary tháng hiện tại
        int currentYear = LocalDate.now().getYear();
        int currentMonth = LocalDate.now().getMonthValue();

        Optional<AttendanceSummary> attendanceSummary = attendanceSummaryRepository
                .findByEmployeeIdAndYearAndMonth(employeeId, currentYear, currentMonth);

        if (attendanceSummary.isPresent()) {
            AttendanceSummary summary = attendanceSummary.get();
            builder.currentMonthWorkDays(summary.getActualDays() != null ? summary.getActualDays().intValue() : 0);
            builder.currentMonthLateCount(summary.getLateCount() != null ? summary.getLateCount().intValue() : 0);
            builder.currentMonthAbsentCount(summary.getAbsentCount() != null ? summary.getAbsentCount().intValue() : 0);
            builder.standardWorkDays(summary.getWorkDays() != null ? summary.getWorkDays().intValue() : 22);
        } else {
            builder.currentMonthWorkDays(0);
            builder.currentMonthLateCount(0);
            builder.currentMonthAbsentCount(0);
            builder.standardWorkDays(22);
        }

        // 3. Latest Published Payslip
        List<Payslip> payslips = payslipRepository.findPublishedPayslipsByEmployeeId(employeeId);
        if (!payslips.isEmpty()) {
            Payslip latestPayslip = payslips.get(0);
            builder.latestPayslip(EmployeeDashboardDto.LatestPayslipSummary.builder()
                    .id(latestPayslip.getId())
                    .year(latestPayslip.getPayrollRun().getYear())
                    .month(latestPayslip.getPayrollRun().getMonth())
                    .netSalary(latestPayslip.getNetSalary())
                    .pdfUrl(latestPayslip.getPdfUrl())
                    .build());
        }

        // 4. Pending Requests Count
        Long pendingLeaveCount = entityManager.createQuery(
                "SELECT COUNT(lr) FROM LeaveRequest lr WHERE lr.employee.id = :employeeId AND lr.status = 'PENDING'", Long.class)
                .setParameter("employeeId", employeeId)
                .getSingleResult();
        builder.pendingLeaveRequests(pendingLeaveCount);

        Long pendingAttendanceCount = entityManager.createQuery(
                "SELECT COUNT(al) FROM AttendanceLog al WHERE al.employee.id = :employeeId AND al.status = 'PENDING_ADJUST'", Long.class)
                .setParameter("employeeId", employeeId)
                .getSingleResult();
        builder.pendingAttendanceAdjustments(pendingAttendanceCount);

        return builder.build();
    }
}
