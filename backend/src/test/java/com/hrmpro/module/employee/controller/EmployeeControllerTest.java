package com.hrmpro.module.employee.controller;

import com.hrmpro.config.TestSecurityConfig;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.hrmpro.config.SecurityConfig;
import com.hrmpro.config.HrmSecurityEvaluator;
import com.hrmpro.module.employee.dto.EmployeeCreateRequest;
import com.hrmpro.module.employee.dto.EmployeeResponse;
import com.hrmpro.module.employee.dto.EmployeeUpdateRequest;
import com.hrmpro.module.employee.dto.SelfUpdateRequest;
import com.hrmpro.module.employee.service.EmployeeService;
import com.hrmpro.common.dto.PageResponse;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDate;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(EmployeeController.class)
@Import({SecurityConfig.class, TestSecurityConfig.class})
@ActiveProfiles("test")
@DisplayName("EmployeeController Integration Tests (MockMvc)")
class EmployeeControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private EmployeeService employeeService;


    @MockBean(name = "hrmSecurity")
    private HrmSecurityEvaluator hrmSecurity;


    @Test
    @DisplayName("GET /api/v1/employees — thành công với role HR_ADMIN → 200")
    @WithMockUser(roles = "HR_ADMIN")
    void getEmployees_WithHrAdmin_Returns200() throws Exception {
        EmployeeResponse employee = EmployeeResponse.builder()
                .id(1L)
                .employeeCode("EMP001")
                .firstName("John")
                .lastName("Doe")
                .email("john.doe@hrmpro.com")
                .status("WORKING")
                .build();

        PageResponse<EmployeeResponse> pageResponse = new PageResponse<>(List.of(employee), 0, 10, 1, 1);

        when(employeeService.getEmployees(any(), any(), any(), any())).thenReturn(pageResponse);

        mockMvc.perform(get("/api/v1/employees")
                        .param("search", "John")
                        .param("page", "0")
                        .param("size", "10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.content[0].employeeCode").value("EMP001"));
    }

    @Test
    @DisplayName("GET /api/v1/employees — không có quyền (role EMPLOYEE) → 403")
    @WithMockUser(roles = "EMPLOYEE")
    void getEmployees_WithEmployeeRole_Returns403() throws Exception {
        mockMvc.perform(get("/api/v1/employees"))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("GET /api/v1/employees/{id} — thành công với role HR_ADMIN → 200")
    @WithMockUser(roles = "HR_ADMIN")
    void getEmployee_WithHrAdmin_Returns200() throws Exception {
        EmployeeResponse response = EmployeeResponse.builder()
                .id(1L).employeeCode("EMP001").firstName("John").lastName("Doe").build();

        when(employeeService.getEmployee(1L)).thenReturn(response);

        mockMvc.perform(get("/api/v1/employees/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.employeeCode").value("EMP001"));
    }

    @Test
    @DisplayName("GET /api/v1/employees/{id} — là chính mình → 200")
    @WithMockUser(roles = "EMPLOYEE")
    void getEmployee_IsSelf_Returns200() throws Exception {
        EmployeeResponse response = EmployeeResponse.builder()
                .id(1L).employeeCode("EMP001").firstName("John").lastName("Doe").build();

        when(hrmSecurity.isSelf(1L)).thenReturn(true);
        when(employeeService.getEmployee(1L)).thenReturn(response);

        mockMvc.perform(get("/api/v1/employees/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.employeeCode").value("EMP001"));
    }

    @Test
    @DisplayName("POST /api/v1/employees — thành công với role HR_ADMIN → 200")
    @WithMockUser(roles = "HR_ADMIN")
    void createEmployee_WithHrAdmin_Returns200() throws Exception {
        EmployeeCreateRequest request = EmployeeCreateRequest.builder()
                .employeeCode("EMP002")
                .firstName("Alice")
                .lastName("Green")
                .email("alice.green@hrmpro.com")
                .hireDate(LocalDate.of(2026, 1, 1))
                .build();

        EmployeeResponse response = EmployeeResponse.builder()
                .id(2L).employeeCode("EMP002").firstName("Alice").lastName("Green").build();

        when(employeeService.createEmployee(any(EmployeeCreateRequest.class))).thenReturn(response);

        mockMvc.perform(post("/api/v1/employees")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request))
                        .with(csrf()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.employeeCode").value("EMP002"));
    }

    @Test
    @DisplayName("PUT /api/v1/employees/{id} — thành công với role HR_ADMIN → 200")
    @WithMockUser(roles = "HR_ADMIN")
    void updateEmployee_WithHrAdmin_Returns200() throws Exception {
        EmployeeUpdateRequest request = EmployeeUpdateRequest.builder()
                .firstName("John")
                .lastName("Smith")
                .email("john.smith@hrmpro.com")
                .build();

        EmployeeResponse response = EmployeeResponse.builder()
                .id(1L).employeeCode("EMP001").firstName("John").lastName("Smith").build();

        when(employeeService.updateEmployee(eq(1L), any(EmployeeUpdateRequest.class))).thenReturn(response);

        mockMvc.perform(put("/api/v1/employees/1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request))
                        .with(csrf()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.lastName").value("Smith"));
    }

    @Test
    @DisplayName("PATCH /api/v1/employees/{id}/self — tự cập nhật thông tin thành công → 200")
    @WithMockUser(roles = "EMPLOYEE")
    void selfUpdateEmployee_Returns200() throws Exception {
        SelfUpdateRequest request = SelfUpdateRequest.builder()
                .phone("0987654321")
                .personalEmail("personal@mail.com")
                .build();

        EmployeeResponse response = EmployeeResponse.builder()
                .id(1L).phone("0987654321").personalEmail("personal@mail.com").build();

        when(hrmSecurity.isSelf(1L)).thenReturn(true);
        when(employeeService.selfUpdateEmployee(eq(1L), any(SelfUpdateRequest.class))).thenReturn(response);

        mockMvc.perform(patch("/api/v1/employees/1/self")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request))
                        .with(csrf()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.phone").value("0987654321"));
    }

    @Test
    @DisplayName("POST /api/v1/employees/{id}/avatar — upload avatar thành công → 200")
    @WithMockUser(roles = "EMPLOYEE")
    void updateAvatar_Returns200() throws Exception {
        MockMultipartFile file = new MockMultipartFile("file", "avatar.png", "image/png", "some-image-bytes".getBytes());
        EmployeeResponse response = EmployeeResponse.builder().id(1L).avatarUrl("http://minio/avatar.png").build();

        when(hrmSecurity.isSelf(1L)).thenReturn(true);
        when(employeeService.updateAvatar(eq(1L), any())).thenReturn(response);

        mockMvc.perform(multipart("/api/v1/employees/1/avatar")
                        .file(file)
                        .with(csrf()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.avatarUrl").value("http://minio/avatar.png"));
    }

    @Test
    @DisplayName("POST /api/v1/employees/{id}/terminate — thôi việc nhân viên thành công → 200")
    @WithMockUser(roles = "HR_ADMIN")
    void terminateEmployee_Returns200() throws Exception {
        EmployeeResponse response = EmployeeResponse.builder()
                .id(1L).status("TERMINATED").terminationDate(LocalDate.of(2026, 6, 1)).build();

        when(employeeService.terminateEmployee(eq(1L), any(LocalDate.class))).thenReturn(response);

        mockMvc.perform(post("/api/v1/employees/1/terminate")
                        .param("terminationDate", "2026-06-01")
                        .with(csrf()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("TERMINATED"));
    }
}
