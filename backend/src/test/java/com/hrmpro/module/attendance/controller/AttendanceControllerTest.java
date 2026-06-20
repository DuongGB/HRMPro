package com.hrmpro.module.attendance.controller;

import com.hrmpro.config.TestSecurityConfig;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.hrmpro.config.SecurityConfig;
import com.hrmpro.config.HrmSecurityEvaluator;
import com.hrmpro.module.attendance.dto.AttendanceAdjustmentRequest;
import com.hrmpro.module.attendance.dto.AttendanceLogResponse;
import com.hrmpro.module.attendance.dto.CheckInRequest;
import com.hrmpro.module.attendance.service.AttendanceService;
import com.hrmpro.module.auth.entity.UserPrincipal;
import com.hrmpro.common.dto.PageResponse;
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
import java.time.LocalTime;
import java.time.LocalDateTime;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(AttendanceController.class)
@Import({SecurityConfig.class, TestSecurityConfig.class})
@ActiveProfiles("test")
@DisplayName("AttendanceController Integration Tests (MockMvc)")
class AttendanceControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private AttendanceService attendanceService;


    @MockBean(name = "hrmSecurity")
    private HrmSecurityEvaluator hrmSecurity;


    @Test
    @DisplayName("POST /api/v1/attendance/check — thành công → 200")
    void check_Success() throws Exception {
        UserPrincipal principal = UserPrincipal.builder()
                .id(1L)
                .username("employee1")
                .employeeId(10L)
                .isActive(true)
                .authorities(List.of(new SimpleGrantedAuthority("ROLE_EMPLOYEE")))
                .build();

        CheckInRequest request = new CheckInRequest("192.168.1.1", "Chrome", "10.0, 106.0");

        AttendanceLogResponse response = AttendanceLogResponse.builder()
                .id(100L)
                .employeeId(10L)
                .workDate(LocalDate.now())
                .checkIn(LocalDateTime.of(LocalDate.now(), LocalTime.of(8, 0)))
                .status("ON_TIME")
                .build();

        when(attendanceService.check(eq(10L), any(CheckInRequest.class))).thenReturn(response);

        mockMvc.perform(post("/api/v1/attendance/check")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request))
                        .with(user(principal))
                        .with(csrf()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.status").value("ON_TIME"));
    }

    @Test
    @DisplayName("POST /api/v1/attendance/adjust — thành công → 200")
    void requestAdjustment_Success() throws Exception {
        UserPrincipal principal = UserPrincipal.builder()
                .id(1L)
                .username("employee1")
                .employeeId(10L)
                .isActive(true)
                .authorities(List.of(new SimpleGrantedAuthority("ROLE_EMPLOYEE")))
                .build();

        AttendanceAdjustmentRequest request = AttendanceAdjustmentRequest.builder()
                .workDate(LocalDate.now())
                .checkIn(LocalDateTime.of(LocalDate.now(), LocalTime.of(8, 0)))
                .checkOut(LocalDateTime.of(LocalDate.now(), LocalTime.of(17, 30)))
                .note("Quên chấm công")
                .build();

        AttendanceLogResponse response = AttendanceLogResponse.builder()
                .id(100L)
                .employeeId(10L)
                .workDate(LocalDate.now())
                .checkIn(LocalDateTime.of(LocalDate.now(), LocalTime.of(8, 0)))
                .checkOut(LocalDateTime.of(LocalDate.now(), LocalTime.of(17, 30)))
                .status("PENDING_ADJUST")
                .build();

        when(attendanceService.requestAdjustment(eq(10L), any(AttendanceAdjustmentRequest.class))).thenReturn(response);

        mockMvc.perform(post("/api/v1/attendance/adjust")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request))
                        .with(user(principal))
                        .with(csrf()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("PENDING_ADJUST"));
    }

    @Test
    @DisplayName("PUT /api/v1/attendance/logs/{id}/approve — phê duyệt thành công → 200")
    void approveAdjustment_Success() throws Exception {
        UserPrincipal principal = UserPrincipal.builder()
                .id(2L)
                .username("manager1")
                .employeeId(20L)
                .isActive(true)
                .authorities(List.of(new SimpleGrantedAuthority("ROLE_MANAGER")))
                .build();

        AttendanceLogResponse response = AttendanceLogResponse.builder()
                .id(100L)
                .employeeId(10L)
                .status("ON_TIME")
                .build();

        when(attendanceService.approveAdjustment(eq(100L), eq(true), eq(20L))).thenReturn(response);

        mockMvc.perform(put("/api/v1/attendance/logs/100/approve")
                        .param("approve", "true")
                        .with(user(principal))
                        .with(csrf()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("ON_TIME"))
                .andExpect(jsonPath("$.message").value("Phê duyệt điều chỉnh công thành công"));
    }

    @Test
    @DisplayName("GET /api/v1/attendance/logs — thành công với role HR_ADMIN → 200")
    void getAttendanceLogs_Success() throws Exception {
        UserPrincipal principal = UserPrincipal.builder()
                .id(3L)
                .username("hr1")
                .employeeId(30L)
                .isActive(true)
                .authorities(List.of(new SimpleGrantedAuthority("ROLE_HR_ADMIN")))
                .build();

        AttendanceLogResponse log = AttendanceLogResponse.builder()
                .id(100L)
                .employeeId(10L)
                .status("ON_TIME")
                .build();

        PageResponse<AttendanceLogResponse> pageResponse = new PageResponse<>(List.of(log), 0, 10, 1, 1);

        when(attendanceService.getAttendanceLogs(
                eq(10L), any(), any(), any(), any(), any(), any()
        )).thenReturn(pageResponse);

        mockMvc.perform(get("/api/v1/attendance/logs")
                        .param("employeeId", "10")
                        .with(user(principal)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.content[0].id").value(100L));
    }

    @Test
    @DisplayName("POST /api/v1/attendance/import — import Excel thành công → 200")
    void importAttendance_Success() throws Exception {
        UserPrincipal principal = UserPrincipal.builder()
                .id(3L)
                .username("hr1")
                .employeeId(30L)
                .isActive(true)
                .authorities(List.of(new SimpleGrantedAuthority("ROLE_HR_ADMIN")))
                .build();

        MockMultipartFile file = new MockMultipartFile(
                "file",
                "attendance.xlsx",
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                "some excel data".getBytes()
        );

        doNothing().when(attendanceService).importAttendanceExcel(any());

        mockMvc.perform(multipart("/api/v1/attendance/import")
                        .file(file)
                        .with(user(principal))
                        .with(csrf()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Import dữ liệu chấm công từ file Excel thành công"));
    }
}
