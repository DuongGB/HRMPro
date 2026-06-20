package com.hrmpro.module.organization.controller;

import com.hrmpro.config.TestSecurityConfig;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.hrmpro.config.SecurityConfig;
import com.hrmpro.config.HrmSecurityEvaluator;
import com.hrmpro.module.organization.dto.DepartmentRequest;
import com.hrmpro.module.organization.dto.DepartmentResponse;
import com.hrmpro.module.organization.service.DepartmentService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(DepartmentController.class)
@Import({SecurityConfig.class, TestSecurityConfig.class})
@ActiveProfiles("test")
@DisplayName("DepartmentController Integration Tests (MockMvc)")
class DepartmentControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private DepartmentService departmentService;


    @MockBean(name = "hrmSecurity")
    private HrmSecurityEvaluator hrmSecurity;


    @Test
    @DisplayName("GET /api/v1/departments/tree — thành công → 200")
    @WithMockUser
    void getDepartmentTree_Success() throws Exception {
        DepartmentResponse treeNode = DepartmentResponse.builder()
                .id(1L).code("DEP-IT").name("IT Department").build();

        when(departmentService.getDepartmentTree()).thenReturn(List.of(treeNode));

        mockMvc.perform(get("/api/v1/departments/tree"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data[0].code").value("DEP-IT"));
    }

    @Test
    @DisplayName("POST /api/v1/departments — thành công với role HR_ADMIN → 200")
    @WithMockUser(roles = "HR_ADMIN")
    void createDepartment_Success() throws Exception {
        DepartmentRequest request = DepartmentRequest.builder()
                .code("DEP-HR")
                .name("HR Department")
                .build();

        DepartmentResponse response = DepartmentResponse.builder()
                .id(2L).code("DEP-HR").name("HR Department").build();

        when(departmentService.createDepartment(any(DepartmentRequest.class))).thenReturn(response);

        mockMvc.perform(post("/api/v1/departments")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request))
                        .with(csrf()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.code").value("DEP-HR"));
    }

    @Test
    @DisplayName("DELETE /api/v1/departments/{id} — thành công với role HR_ADMIN → 200")
    @WithMockUser(roles = "HR_ADMIN")
    void deleteDepartment_Success() throws Exception {
        doNothing().when(departmentService).deleteDepartment(1L);

        mockMvc.perform(delete("/api/v1/departments/1")
                        .with(csrf()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Ngừng hoạt động phòng ban thành công"));
    }
}
