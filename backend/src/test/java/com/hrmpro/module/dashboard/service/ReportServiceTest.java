package com.hrmpro.module.dashboard.service;

import com.hrmpro.module.attendance.entity.AttendanceSummary;
import com.hrmpro.module.attendance.repository.AttendanceSummaryRepository;
import com.hrmpro.module.dashboard.dto.DashboardReportDto;
import com.hrmpro.module.dashboard.dto.EmployeeDashboardDto;
import com.hrmpro.module.employee.entity.Employee;
import com.hrmpro.module.employee.repository.EmployeeRepository;
import com.hrmpro.module.leave.repository.LeaveRequestRepository;
import com.hrmpro.module.payroll.entity.PayrollRun;
import com.hrmpro.module.payroll.entity.Payslip;
import com.hrmpro.module.payroll.repository.PayrollRunRepository;
import com.hrmpro.module.payroll.repository.PayslipRepository;
import com.hrmpro.module.recruitment.entity.JobPosting;
import com.hrmpro.module.recruitment.repository.ApplicationRepository;
import com.hrmpro.module.recruitment.repository.JobPostingRepository;
import jakarta.persistence.EntityManager;
import jakarta.persistence.TypedQuery;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.math.BigDecimal;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.contains;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@DisplayName("ReportService Unit Tests")
class ReportServiceTest {

    @Mock private EmployeeRepository employeeRepository;
    @Mock private JobPostingRepository jobPostingRepository;
    @Mock private ApplicationRepository applicationRepository;
    @Mock private PayslipRepository payslipRepository;
    @Mock private PayrollRunRepository payrollRunRepository;
    @Mock private LeaveRequestRepository leaveRequestRepository;
    @Mock private AttendanceSummaryRepository attendanceSummaryRepository;
    @Mock private EntityManager entityManager;

    @InjectMocks
    private ReportService reportService;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(reportService, "entityManager", entityManager);
    }


    @Test
    @DisplayName("getDashboardReport — cho role HR_ADMIN → trả về thống kê chung + phòng ban + tuyển dụng")
    @SuppressWarnings("unchecked")
    void getDashboardReport_ForHrAdmin() {
        Employee emp = Employee.builder().id(1L).status("ACTIVE").build();
        JobPosting job = JobPosting.builder().id(1L).status("OPEN").build();

        when(employeeRepository.findAll()).thenReturn(List.of(emp));
        when(jobPostingRepository.findByStatus("OPEN")).thenReturn(List.of(job));
        when(applicationRepository.count()).thenReturn(10L);

        // Mock EntityManager queries
        TypedQuery<BigDecimal> bigDecimalQuery = mock(TypedQuery.class);
        when(entityManager.createQuery(contains("SUM(p.netSalary)"), eq(BigDecimal.class))).thenReturn(bigDecimalQuery);
        when(bigDecimalQuery.getSingleResult()).thenReturn(BigDecimal.valueOf(150000000));

        TypedQuery<Object[]> hcQuery = mock(TypedQuery.class);
        when(entityManager.createQuery(contains("department.name"), eq(Object[].class))).thenReturn(hcQuery);
        List<Object[]> hcResults = java.util.Arrays.asList(new Object[][]{{"IT", 5L}});
        when(hcQuery.getResultList()).thenReturn(hcResults);

        TypedQuery<Object[]> costTrendQuery = mock(TypedQuery.class);
        when(entityManager.createQuery(contains("SUM(p.netSalary) FROM Payslip p JOIN p.payrollRun"), eq(Object[].class))).thenReturn(costTrendQuery);
        List<Object[]> monthlyCosts = java.util.Arrays.asList(new Object[][]{{"06/2026", BigDecimal.valueOf(150000000)}});
        when(costTrendQuery.getResultList()).thenReturn(monthlyCosts);

        TypedQuery<Object[]> funnelQuery = mock(TypedQuery.class);
        when(entityManager.createQuery(contains("stage, COUNT"), eq(Object[].class))).thenReturn(funnelQuery);
        List<Object[]> funnelResults = java.util.Arrays.asList(new Object[][]{{"NEW", 3L}});
        when(funnelQuery.getResultList()).thenReturn(funnelResults);

        TypedQuery<Object[]> sourceQuery = mock(TypedQuery.class);
        when(entityManager.createQuery(contains("a.source"), eq(Object[].class))).thenReturn(sourceQuery);
        List<Object[]> sourceResults = java.util.Arrays.asList(new Object[][]{{"Linkedin", 7L}});
        when(sourceQuery.getResultList()).thenReturn(sourceResults);


        DashboardReportDto report = reportService.getDashboardReport(1L, List.of("ROLE_HR_ADMIN"));

        assertThat(report).isNotNull();
        assertThat(report.getTotalEmployees()).isEqualTo(1L);
        assertThat(report.getActiveJobs()).isEqualTo(1L);
        assertThat(report.getTotalApplications()).isEqualTo(10L);
        assertThat(report.getCurrentMonthPayrollCost()).isEqualTo(BigDecimal.valueOf(150000000));
        assertThat(report.getDeptHeadcounts()).hasSize(1);
        assertThat(report.getDeptHeadcounts().get(0).getDepartmentName()).isEqualTo("IT");
        assertThat(report.getMonthlyPayrolls()).hasSize(1);
    }

    @Test
    @DisplayName("getEmployeeDashboard — trả về thông tin nghỉ phép, chấm công, phiếu lương cá nhân")
    @SuppressWarnings("unchecked")
    void getEmployeeDashboard_Success() {
        // Mock Leave Balance query
        TypedQuery<Object[]> leaveQuery = mock(TypedQuery.class);
        when(entityManager.createQuery(contains("LeaveBalance"), eq(Object[].class))).thenReturn(leaveQuery);
        when(leaveQuery.setParameter(anyString(), any())).thenReturn(leaveQuery);
        List<Object[]> leaveResults = java.util.Arrays.asList(new Object[][]{{
                BigDecimal.valueOf(12.0), BigDecimal.valueOf(2.0), BigDecimal.valueOf(10.0)
        }});
        when(leaveQuery.getResultList()).thenReturn(leaveResults);

        // Mock Attendance Summary
        AttendanceSummary summary = AttendanceSummary.builder()
                .actualDays(BigDecimal.valueOf(20))
                .lateCount(1)
                .absentCount(0)
                .workDays(BigDecimal.valueOf(22))
                .build();
        when(attendanceSummaryRepository.findByEmployeeIdAndYearAndMonth(eq(10L), anyInt(), anyInt()))
                .thenReturn(Optional.of(summary));

        // Mock Payslip
        PayrollRun run = PayrollRun.builder().year(2026).month(6).build();
        Payslip payslip = Payslip.builder().id(100L).payrollRun(run).netSalary(BigDecimal.valueOf(18000000)).build();
        when(payslipRepository.findPublishedPayslipsByEmployeeId(10L)).thenReturn(List.of(payslip));

        // Mock Pending Requests
        TypedQuery<Long> pendingQuery = mock(TypedQuery.class);
        when(entityManager.createQuery(anyString(), eq(Long.class))).thenReturn(pendingQuery);
        when(pendingQuery.setParameter(anyString(), any())).thenReturn(pendingQuery);
        when(pendingQuery.getSingleResult()).thenReturn(1L);

        EmployeeDashboardDto dashboard = reportService.getEmployeeDashboard(10L);

        assertThat(dashboard).isNotNull();
        assertThat(dashboard.getTotalLeaveDays()).isEqualTo(BigDecimal.valueOf(12.0));
        assertThat(dashboard.getRemainingLeaveDays()).isEqualTo(BigDecimal.valueOf(10.0));
        assertThat(dashboard.getCurrentMonthWorkDays()).isEqualTo(20);
        assertThat(dashboard.getCurrentMonthLateCount()).isEqualTo(1);
        assertThat(dashboard.getLatestPayslip().getNetSalary()).isEqualTo(BigDecimal.valueOf(18000000));
        assertThat(dashboard.getPendingLeaveRequests()).isEqualTo(1L);
    }
}
