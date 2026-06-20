package com.hrmpro.module.auth.controller;

import com.hrmpro.config.TestSecurityConfig;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.hrmpro.config.SecurityConfig;
import com.hrmpro.module.auth.dto.*;
import com.hrmpro.module.auth.service.UserService;
import com.hrmpro.common.dto.PageResponse;
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
import java.util.Set;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(UserController.class)
@Import({SecurityConfig.class, TestSecurityConfig.class})
@ActiveProfiles("test")
@DisplayName("UserController Integration Tests (MockMvc)")
class UserControllerTest {

    @Autowired private MockMvc mockMvc;
    @Autowired private ObjectMapper objectMapper;

    @MockBean private UserService userService;


    @Test
    @DisplayName("GET /api/v1/users — SUPER_ADMIN → 200")
    @WithMockUser(roles = "SUPER_ADMIN")
    void getUsers_WithAdminRole_Returns200() throws Exception {
        UserResponse user = UserResponse.builder()
                .id(1L).username("admin").isActive(true).roles(Set.of("SUPER_ADMIN")).build();
        PageResponse<UserResponse> pageResponse = new PageResponse<>(List.of(user), 0, 10, 1, 1);

        when(userService.getUsers(any())).thenReturn(pageResponse);

        mockMvc.perform(get("/api/v1/users"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.content[0].username").value("admin"));
    }

    @Test
    @DisplayName("GET /api/v1/users — EMPLOYEE role → 403")
    @WithMockUser(roles = "EMPLOYEE")
    void getUsers_WithEmployeeRole_Returns403() throws Exception {
        mockMvc.perform(get("/api/v1/users"))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("POST /api/v1/users — tạo user thành công → 200")
    @WithMockUser(roles = "SUPER_ADMIN")
    void createUser_WithAdminRole_Returns200() throws Exception {
        UserCreateRequest request = UserCreateRequest.builder()
                .username("newuser")
                .password("password123")
                .roles(Set.of("EMPLOYEE"))
                .build();

        UserResponse response = UserResponse.builder()
                .id(10L).username("newuser").isActive(true).roles(Set.of("EMPLOYEE")).build();

        when(userService.createUser(any(UserCreateRequest.class))).thenReturn(response);

        mockMvc.perform(post("/api/v1/users")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request))
                        .with(csrf()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.username").value("newuser"));
    }

    @Test
    @DisplayName("PUT /api/v1/users/{id}/status — toggle status → 200")
    @WithMockUser(roles = "SUPER_ADMIN")
    void toggleUserStatus_Returns200() throws Exception {
        UserResponse response = UserResponse.builder()
                .id(1L).username("admin").isActive(false).build();

        when(userService.toggleUserStatus(1L, false)).thenReturn(response);

        mockMvc.perform(put("/api/v1/users/1/status")
                        .param("isActive", "false")
                        .with(csrf()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Khóa tài khoản thành công"));
    }

    @Test
    @DisplayName("POST /api/v1/users/{id}/reset-password — thành công → 200")
    @WithMockUser(roles = "SUPER_ADMIN")
    void resetPassword_Returns200() throws Exception {
        PasswordResetRequest request = new PasswordResetRequest();
        request.setNewPassword("newPass123");

        mockMvc.perform(post("/api/v1/users/1/reset-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request))
                        .with(csrf()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Đặt lại mật khẩu người dùng thành công"));
    }

    @Test
    @DisplayName("PUT /api/v1/users/{id}/roles — update roles → 200")
    @WithMockUser(roles = "SUPER_ADMIN")
    void updateUserRoles_Returns200() throws Exception {
        UpdateRolesRequest request = new UpdateRolesRequest(Set.of("HR_ADMIN", "MANAGER"));
        UserResponse response = UserResponse.builder()
                .id(1L).username("admin").roles(Set.of("HR_ADMIN", "MANAGER")).build();

        when(userService.updateUserRoles(any(), any(UpdateRolesRequest.class))).thenReturn(response);

        mockMvc.perform(put("/api/v1/users/1/roles")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request))
                        .with(csrf()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Cập nhật vai trò người dùng thành công"));
    }
}
