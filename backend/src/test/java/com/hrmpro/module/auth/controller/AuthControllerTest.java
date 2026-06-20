package com.hrmpro.module.auth.controller;

import com.hrmpro.config.TestSecurityConfig;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.hrmpro.config.SecurityConfig;
import com.hrmpro.module.auth.dto.*;
import com.hrmpro.module.auth.service.AuthService;
import com.hrmpro.util.TestFixtures;
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

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(AuthController.class)
@Import({SecurityConfig.class, TestSecurityConfig.class})
@ActiveProfiles("test")
@DisplayName("AuthController Integration Tests (MockMvc)")
class AuthControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean private AuthService authService;


    @Test
    @DisplayName("POST /api/v1/auth/login — thành công → 200")
    void login_WithValidCredentials_Returns200() throws Exception {
        LoginRequest request = new LoginRequest("admin", "password123");

        UserResponse userResponse = UserResponse.builder()
                .id(1L).username("admin").isActive(true).build();

        LoginResponse loginResponse = new LoginResponse(
                "jwt-token", "refresh-token", "Bearer", 3600L, userResponse
        );

        when(authService.login(any(LoginRequest.class))).thenReturn(loginResponse);

        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request))
                        .with(csrf()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.accessToken").value("jwt-token"))
                .andExpect(jsonPath("$.data.user.username").value("admin"));
    }

    @Test
    @DisplayName("POST /api/v1/auth/login — body thiếu username → 400")
    void login_WithMissingUsername_Returns400() throws Exception {
        String invalidBody = "{\"password\": \"password123\"}";

        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(invalidBody)
                        .with(csrf()))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("POST /api/v1/auth/refresh — thành công → 200")
    void refresh_WithValidToken_Returns200() throws Exception {
        RefreshTokenRequest request = new RefreshTokenRequest("valid-refresh");
        RefreshTokenResponse response = new RefreshTokenResponse("new-access-token", "Bearer", 3600L);

        when(authService.refresh(any(RefreshTokenRequest.class))).thenReturn(response);

        mockMvc.perform(post("/api/v1/auth/refresh")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request))
                        .with(csrf()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.accessToken").value("new-access-token"));
    }

    @Test
    @DisplayName("POST /api/v1/auth/logout — thành công → 200")
    @WithMockUser
    void logout_Returns200() throws Exception {
        RefreshTokenRequest request = new RefreshTokenRequest("some-refresh-token");

        mockMvc.perform(post("/api/v1/auth/logout")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request))
                        .with(csrf()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Đăng xuất thành công"));
    }

    @Test
    @DisplayName("POST /api/v1/auth/change-password — có auth → 200")
    @WithMockUser(username = "employee1")
    void changePassword_WithAuthentication_Returns200() throws Exception {
        ChangePasswordRequest request = new ChangePasswordRequest("oldPass", "newPass123");

        mockMvc.perform(post("/api/v1/auth/change-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request))
                        .with(csrf()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Thay đổi mật khẩu thành công"));
    }
}
