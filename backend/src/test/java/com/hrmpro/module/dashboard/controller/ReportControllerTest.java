package com.hrmpro.module.dashboard.controller;

import com.hrmpro.config.TestSecurityConfig;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.hrmpro.config.SecurityConfig;
import com.hrmpro.config.HrmSecurityEvaluator;
import com.hrmpro.module.auth.entity.UserPrincipal;
import com.hrmpro.module.dashboard.dto.DashboardReportDto;
import com.hrmpro.module.dashboard.dto.EmployeeDashboardDto;
import com.hrmpro.module.dashboard.service.ReportService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(ReportController.class)
@Import({SecurityConfig.class, TestSecurityConfig.class})
@ActiveProfiles("test")
@DisplayName("ReportController Integration Tests (MockMvc)")
class ReportControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private ReportService reportService;


    @MockBean(name = "hrmSecurity")
    private HrmSecurityEvaluator hrmSecurity;


    @Test
    @DisplayName("GET /api/v1/dashboard/reports — thành công → 200")
    void getDashboardReport_Success() throws Exception {
        UserPrincipal principal = UserPrincipal.builder()
                .id(1L)
                .username("admin")
                .employeeId(10L)
                .isActive(true)
                .authorities(List.of(new SimpleGrantedAuthority("ROLE_HR_ADMIN")))
                .build();

        DashboardReportDto dto = DashboardReportDto.builder()
                .totalEmployees(50L)
                .activeJobs(5L)
                .totalApplications(20L)
                .build();

        when(reportService.getDashboardReport(eq(10L), any())).thenReturn(dto);

        mockMvc.perform(get("/api/v1/dashboard/reports")
                        .with(user(principal)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.totalEmployees").value(50L))
                .andExpect(jsonPath("$.data.activeJobs").value(5L));
    }

    @Test
    @DisplayName("GET /api/v1/dashboard/employee — thành công → 200")
    void getEmployeeDashboard_Success() throws Exception {
        UserPrincipal principal = UserPrincipal.builder()
                .id(1L)
                .username("employee1")
                .employeeId(10L)
                .isActive(true)
                .authorities(List.of(new SimpleGrantedAuthority("ROLE_EMPLOYEE")))
                .build();

        EmployeeDashboardDto dto = EmployeeDashboardDto.builder()
                .totalLeaveDays(BigDecimal.valueOf(12.0))
                .remainingLeaveDays(BigDecimal.valueOf(10.0))
                .build();

        when(reportService.getEmployeeDashboard(10L)).thenReturn(dto);

        mockMvc.perform(get("/api/v1/dashboard/employee")
                        .with(user(principal)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.totalLeaveDays").value(12.0));
    }
}
