package com.hrmpro.module.payroll.controller;

import com.hrmpro.config.TestSecurityConfig;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.hrmpro.config.SecurityConfig;
import com.hrmpro.config.HrmSecurityEvaluator;
import com.hrmpro.module.auth.entity.UserPrincipal;
import com.hrmpro.module.payroll.dto.PayrollRunCreateDto;
import com.hrmpro.module.payroll.dto.SalaryConfigDto;
import com.hrmpro.module.payroll.entity.PayrollRun;
import com.hrmpro.module.payroll.entity.SalaryConfig;
import com.hrmpro.module.employee.entity.Employee;
import com.hrmpro.module.payroll.service.PayrollService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.io.ByteArrayInputStream;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(PayrollController.class)
@Import({SecurityConfig.class, TestSecurityConfig.class})
@ActiveProfiles("test")
@DisplayName("PayrollController Integration Tests (MockMvc)")
class PayrollControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private PayrollService payrollService;


    @MockBean(name = "hrmSecurity")
    private HrmSecurityEvaluator hrmSecurity;


    @Test
    @DisplayName("GET /api/v1/payroll/configs/active — thành công → 200")
    @WithMockUser(roles = "HR_ADMIN")
    void getActiveConfig_Success() throws Exception {
        SalaryConfig config = SalaryConfig.builder()
                .id(1L)
                .minWage(BigDecimal.valueOf(4680000))
                .isActive(true)
                .build();

        when(payrollService.getActiveSalaryConfig()).thenReturn(config);

        mockMvc.perform(get("/api/v1/payroll/configs/active"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.minWage").value(4680000));
    }

    @Test
    @DisplayName("POST /api/v1/payroll/runs — tạo kỳ chạy lương thành công → 200")
    void createPayrollRun_Success() throws Exception {
        UserPrincipal principal = UserPrincipal.builder()
                .id(1L)
                .username("hr1")
                .employeeId(10L)
                .isActive(true)
                .authorities(List.of(new SimpleGrantedAuthority("ROLE_HR_ADMIN")))
                .build();

        PayrollRunCreateDto dto = new PayrollRunCreateDto(2026, 6, "Kỳ lương tháng 6");

        Employee runner = Employee.builder().id(10L).firstName("HR").lastName("User").build();
        PayrollRun run = PayrollRun.builder()
                .id(100L)
                .year(2026)
                .month(6)
                .notes("Kỳ lương tháng 6")
                .status("DRAFT")
                .runBy(runner)
                .build();

        when(payrollService.createPayrollRun(eq(2026), eq(6), eq("Kỳ lương tháng 6"), any())).thenReturn(run);

        mockMvc.perform(post("/api/v1/payroll/runs")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto))
                        .with(user(principal))
                        .with(csrf()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.id").value(100L))
                .andExpect(jsonPath("$.data.status").value("DRAFT"));
    }

    @Test
    @DisplayName("GET /api/v1/payroll/runs/{id}/export-bank — xuất chuyển khoản ngân hàng thành công → 200")
    @WithMockUser(roles = "HR_ADMIN")
    void exportBankList_Success() throws Exception {
        byte[] excelBytes = "dummy excel content".getBytes();
        ByteArrayInputStream stream = new ByteArrayInputStream(excelBytes);

        when(payrollService.exportBankList(100L)).thenReturn(stream);

        mockMvc.perform(get("/api/v1/payroll/runs/100/export-bank"))
                .andExpect(status().isOk())
                .andExpect(header().string("Content-Disposition", "attachment; filename=danh-sach-chuyen-khoan.xlsx"))
                .andExpect(content().bytes(excelBytes));
    }
}
