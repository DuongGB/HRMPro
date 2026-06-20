package com.hrmpro.module.leave.controller;

import com.hrmpro.config.TestSecurityConfig;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.hrmpro.config.SecurityConfig;
import com.hrmpro.config.HrmSecurityEvaluator;
import com.hrmpro.module.auth.entity.UserPrincipal;
import com.hrmpro.module.leave.dto.LeaveApprovalDto;
import com.hrmpro.module.leave.dto.LeaveBalanceResponse;
import com.hrmpro.module.leave.dto.LeaveRequestDto;
import com.hrmpro.module.leave.dto.LeaveRequestResponse;
import com.hrmpro.module.leave.service.LeaveService;
import com.hrmpro.common.dto.PageResponse;
import java.math.BigDecimal;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDate;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(LeaveController.class)
@Import({SecurityConfig.class, TestSecurityConfig.class})
@ActiveProfiles("test")
@DisplayName("LeaveController Integration Tests (MockMvc)")
class LeaveControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private LeaveService leaveService;


    @MockBean(name = "hrmSecurity")
    private HrmSecurityEvaluator hrmSecurity;


    @Test
    @DisplayName("GET /api/v1/leaves/balances — thành công → 200")
    void getLeaveBalances_Success() throws Exception {
        UserPrincipal principal = UserPrincipal.builder()
                .id(1L)
                .username("employee1")
                .employeeId(10L)
                .isActive(true)
                .authorities(List.of(new SimpleGrantedAuthority("ROLE_EMPLOYEE")))
                .build();

        LeaveBalanceResponse balance = LeaveBalanceResponse.builder()
                .leaveTypeName("Nghỉ phép năm")
                .totalDays(BigDecimal.valueOf(12.0))
                .usedDays(BigDecimal.valueOf(2.0))
                .pendingDays(BigDecimal.valueOf(1.0))
                .remainingDays(BigDecimal.valueOf(9.0))
                .build();

        when(leaveService.getLeaveBalances(10L, LocalDate.now().getYear())).thenReturn(List.of(balance));

        mockMvc.perform(get("/api/v1/leaves/balances")
                        .with(user(principal)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data[0].leaveTypeName").value("Nghỉ phép năm"))
                .andExpect(jsonPath("$.data[0].remainingDays").value(9.0));
    }

    @Test
    @DisplayName("POST /api/v1/leaves/requests — thành công → 200")
    void createLeaveRequest_Success() throws Exception {
        UserPrincipal principal = UserPrincipal.builder()
                .id(1L)
                .username("employee1")
                .employeeId(10L)
                .isActive(true)
                .authorities(List.of(new SimpleGrantedAuthority("ROLE_EMPLOYEE")))
                .build();

        LeaveRequestDto requestDto = LeaveRequestDto.builder()
                .leaveTypeCode("ANNUAL")
                .startDate(LocalDate.of(2026, 7, 1))
                .endDate(LocalDate.of(2026, 7, 3))
                .totalDays(BigDecimal.valueOf(3.0))
                .reason("Nghỉ việc gia đình")
                .build();

        MockMultipartFile requestPart = new MockMultipartFile(
                "request",
                "",
                MediaType.APPLICATION_JSON_VALUE,
                objectMapper.writeValueAsBytes(requestDto)
        );

        MockMultipartFile filePart = new MockMultipartFile(
                "file",
                "test-file.pdf",
                MediaType.APPLICATION_PDF_VALUE,
                "some-bytes".getBytes()
        );

        LeaveRequestResponse response = LeaveRequestResponse.builder()
                .id(100L)
                .employeeId(10L)
                .leaveTypeName("Nghỉ phép năm")
                .startDate(LocalDate.of(2026, 7, 1))
                .endDate(LocalDate.of(2026, 7, 3))
                .totalDays(BigDecimal.valueOf(3.0))
                .status("PENDING")
                .build();

        when(leaveService.createLeaveRequest(eq(10L), any(LeaveRequestDto.class), any())).thenReturn(response);

        mockMvc.perform(multipart("/api/v1/leaves/requests")
                        .file(requestPart)
                        .file(filePart)
                        .with(user(principal))
                        .with(csrf()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.status").value("PENDING"))
                .andExpect(jsonPath("$.data.totalDays").value(3.0));
    }

    @Test
    @DisplayName("PUT /api/v1/leaves/requests/{id}/approve — Approve thành công bởi Manager → 200")
    void approveLeaveRequest_Success() throws Exception {
        UserPrincipal principal = UserPrincipal.builder()
                .id(2L)
                .username("manager1")
                .employeeId(20L)
                .isActive(true)
                .authorities(List.of(new SimpleGrantedAuthority("ROLE_MANAGER")))
                .build();

        LeaveApprovalDto approvalDto = new LeaveApprovalDto("APPROVED", "Đồng ý cho nghỉ");

        LeaveRequestResponse response = LeaveRequestResponse.builder()
                .id(100L)
                .employeeId(10L)
                .status("APPROVED")
                .build();

        when(leaveService.approveLeaveRequest(eq(100L), any(LeaveApprovalDto.class), eq(20L))).thenReturn(response);

        mockMvc.perform(put("/api/v1/leaves/requests/100/approve")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(approvalDto))
                        .with(user(principal))
                        .with(csrf()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("APPROVED"))
                .andExpect(jsonPath("$.message").value("Duyệt đơn nghỉ phép thành công"));
    }

    @Test
    @DisplayName("PUT /api/v1/leaves/requests/{id}/override — HR Override thành công → 200")
    void hrOverrideLeaveRequest_Success() throws Exception {
        UserPrincipal principal = UserPrincipal.builder()
                .id(3L)
                .username("hr1")
                .employeeId(30L)
                .isActive(true)
                .authorities(List.of(new SimpleGrantedAuthority("ROLE_HR_ADMIN")))
                .build();

        LeaveApprovalDto approvalDto = new LeaveApprovalDto("REJECTED", "Không đồng ý");

        LeaveRequestResponse response = LeaveRequestResponse.builder()
                .id(100L)
                .employeeId(10L)
                .status("REJECTED")
                .build();

        when(leaveService.hrOverrideLeaveRequest(eq(100L), any(LeaveApprovalDto.class), eq(30L))).thenReturn(response);

        mockMvc.perform(put("/api/v1/leaves/requests/100/override")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(approvalDto))
                        .with(user(principal))
                        .with(csrf()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("REJECTED"));
    }

    @Test
    @DisplayName("GET /api/v1/leaves/requests — lấy danh sách thành công → 200")
    void getLeaveRequests_Success() throws Exception {
        UserPrincipal principal = UserPrincipal.builder()
                .id(1L)
                .username("employee1")
                .employeeId(10L)
                .isActive(true)
                .authorities(List.of(new SimpleGrantedAuthority("ROLE_EMPLOYEE")))
                .build();

        LeaveRequestResponse item = LeaveRequestResponse.builder()
                .id(100L)
                .employeeId(10L)
                .status("PENDING")
                .build();

        PageResponse<LeaveRequestResponse> pageResponse = new PageResponse<>(List.of(item), 0, 10, 1, 1);

        when(leaveService.getLeaveRequests(eq(10L), any(), any(), any(), any(), any(), any())).thenReturn(pageResponse);

        mockMvc.perform(get("/api/v1/leaves/requests")
                        .with(user(principal)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.content[0].id").value(100L));
    }
}
