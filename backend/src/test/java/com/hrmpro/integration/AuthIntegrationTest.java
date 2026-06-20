package com.hrmpro.integration;

import com.hrmpro.module.auth.dto.ChangePasswordRequest;
import com.hrmpro.module.auth.dto.LoginRequest;
import com.hrmpro.module.auth.dto.LoginResponse;
import com.hrmpro.module.auth.entity.Role;
import com.hrmpro.module.auth.entity.User;
import com.hrmpro.module.auth.enums.RoleType;
import com.hrmpro.module.auth.repository.RoleRepository;
import com.hrmpro.module.auth.repository.UserRepository;
import com.hrmpro.common.dto.ApiResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.*;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.HashSet;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;

@DisplayName("Auth Integration Tests (Testcontainers)")
class AuthIntegrationTest extends AbstractIntegrationTest {

    @Autowired
    private TestRestTemplate restTemplate;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @BeforeEach
    void setUp() {
        userRepository.deleteAll();
        roleRepository.deleteAll();

        // Khởi tạo các Role
        Role adminRole = Role.builder().name(RoleType.SUPER_ADMIN).build();
        roleRepository.save(adminRole);

        // Tạo user admin test
        Set<Role> roles = new HashSet<>();
        roles.add(adminRole);

        User adminUser = User.builder()
                .username("integration_admin")
                .password(passwordEncoder.encode("password123"))
                .roles(roles)
                .isActive(true)
                .build();
        userRepository.save(adminUser);
    }

    @Test
    @DisplayName("POST /api/v1/auth/login — đăng nhập thành công và nhận token")
    void login_Success() {
        LoginRequest request = new LoginRequest("integration_admin", "password123");

        ResponseEntity<ApiResponse<LoginResponse>> responseEntity = restTemplate.exchange(
                "/api/v1/auth/login",
                HttpMethod.POST,
                new HttpEntity<>(request),
                new ParameterizedTypeReference<ApiResponse<LoginResponse>>() {}
        );

        assertThat(responseEntity.getStatusCode()).isEqualTo(HttpStatus.OK);
        ApiResponse<LoginResponse> body = responseEntity.getBody();
        assertThat(body).isNotNull();
        assertThat(body.success()).isTrue();
        assertThat(body.data().accessToken()).isNotEmpty();
        assertThat(body.data().tokenType()).isEqualTo("Bearer");
    }

    @Test
    @DisplayName("POST /api/v1/auth/login — đăng nhập thất bại do sai mật khẩu")
    void login_Failure_WrongPassword() {
        LoginRequest request = new LoginRequest("integration_admin", "wrong_password");

        ResponseEntity<ApiResponse<Object>> responseEntity = restTemplate.exchange(
                "/api/v1/auth/login",
                HttpMethod.POST,
                new HttpEntity<>(request),
                new ParameterizedTypeReference<ApiResponse<Object>>() {}
        );

        assertThat(responseEntity.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
        ApiResponse<Object> body = responseEntity.getBody();
        assertThat(body).isNotNull();
        assertThat(body.success()).isFalse();
    }

    @Test
    @DisplayName("POST /api/v1/auth/change-password — đổi mật khẩu thành công bằng JWT Token")
    void changePassword_Success() {
        // Bước 1: Login lấy token
        LoginRequest loginRequest = new LoginRequest("integration_admin", "password123");
        ResponseEntity<ApiResponse<LoginResponse>> loginResponse = restTemplate.exchange(
                "/api/v1/auth/login",
                HttpMethod.POST,
                new HttpEntity<>(loginRequest),
                new ParameterizedTypeReference<ApiResponse<LoginResponse>>() {}
        );
        String token = loginResponse.getBody().data().accessToken();

        // Bước 2: Gọi đổi mật khẩu
        ChangePasswordRequest changeRequest = new ChangePasswordRequest("password123", "newPassword123");
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(token);

        ResponseEntity<ApiResponse<Object>> changeResponse = restTemplate.exchange(
                "/api/v1/auth/change-password",
                HttpMethod.POST,
                new HttpEntity<>(changeRequest, headers),
                new ParameterizedTypeReference<ApiResponse<Object>>() {}
        );

        assertThat(changeResponse.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(changeResponse.getBody().message()).contains("thành công");

        // Bước 3: Thử đăng nhập lại bằng mật khẩu mới
        LoginRequest loginWithNewPassword = new LoginRequest("integration_admin", "newPassword123");
        ResponseEntity<ApiResponse<LoginResponse>> finalLoginResponse = restTemplate.exchange(
                "/api/v1/auth/login",
                HttpMethod.POST,
                new HttpEntity<>(loginWithNewPassword),
                new ParameterizedTypeReference<ApiResponse<LoginResponse>>() {}
        );
        assertThat(finalLoginResponse.getStatusCode()).isEqualTo(HttpStatus.OK);
    }
}
