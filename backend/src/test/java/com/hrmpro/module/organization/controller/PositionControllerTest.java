package com.hrmpro.module.organization.controller;

import com.hrmpro.config.TestSecurityConfig;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.hrmpro.config.SecurityConfig;
import com.hrmpro.config.HrmSecurityEvaluator;
import com.hrmpro.module.organization.dto.PositionRequest;
import com.hrmpro.module.organization.dto.PositionResponse;
import com.hrmpro.module.organization.service.PositionService;
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

@WebMvcTest(PositionController.class)
@Import({SecurityConfig.class, TestSecurityConfig.class})
@ActiveProfiles("test")
@DisplayName("PositionController Integration Tests (MockMvc)")
class PositionControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private PositionService positionService;


    @MockBean(name = "hrmSecurity")
    private HrmSecurityEvaluator hrmSecurity;


    @Test
    @DisplayName("GET /api/v1/positions — lấy tất cả thành công → 200")
    @WithMockUser
    void getAllPositions_Success() throws Exception {
        PositionResponse pos = PositionResponse.builder()
                .id(1L).code("POS-DEV").name("Developer").build();

        when(positionService.getAllPositions()).thenReturn(List.of(pos));

        mockMvc.perform(get("/api/v1/positions"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data[0].code").value("POS-DEV"));
    }

    @Test
    @DisplayName("POST /api/v1/positions — tạo thành công với role HR_ADMIN → 200")
    @WithMockUser(roles = "HR_ADMIN")
    void createPosition_Success() throws Exception {
        PositionRequest request = PositionRequest.builder()
                .code("POS-DEV")
                .name("Developer")
                .departmentId(1L)
                .level("MIDDLE")
                .build();

        PositionResponse response = PositionResponse.builder()
                .id(1L).code("POS-DEV").name("Developer").build();

        when(positionService.createPosition(any(PositionRequest.class))).thenReturn(response);

        mockMvc.perform(post("/api/v1/positions")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request))
                        .with(csrf()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.code").value("POS-DEV"));
    }

    @Test
    @DisplayName("DELETE /api/v1/positions/{id} — ngừng hoạt động thành công với role HR_ADMIN → 200")
    @WithMockUser(roles = "HR_ADMIN")
    void deletePosition_Success() throws Exception {
        doNothing().when(positionService).deletePosition(1L);

        mockMvc.perform(delete("/api/v1/positions/1")
                        .with(csrf()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Ngừng hoạt động chức danh thành công"));
    }
}
