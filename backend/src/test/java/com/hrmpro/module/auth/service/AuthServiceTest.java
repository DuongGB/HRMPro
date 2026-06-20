package com.hrmpro.module.auth.service;

import com.hrmpro.common.exception.AppException;
import com.hrmpro.common.exception.ResourceNotFoundException;
import com.hrmpro.common.service.MinioService;
import com.hrmpro.module.auth.dto.*;
import com.hrmpro.module.auth.entity.Role;
import com.hrmpro.module.auth.entity.User;
import com.hrmpro.module.auth.entity.UserPrincipal;
import com.hrmpro.module.auth.enums.RoleType;
import com.hrmpro.module.auth.repository.UserRepository;
import com.hrmpro.module.employee.entity.Employee;
import com.hrmpro.util.TestFixtures;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.core.ValueOperations;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.HashSet;
import java.util.Optional;
import java.util.Set;
import java.util.concurrent.TimeUnit;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * Unit tests cho AuthService — mock tất cả dependencies.
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("AuthService Unit Tests")
class AuthServiceTest {

    @InjectMocks
    private AuthService authService;

    @Mock private UserRepository userRepository;
    @Mock private CustomUserDetailsService userDetailsService;
    @Mock private JwtService jwtService;
    @Mock private RedisTemplate<String, Object> redisTemplate;
    @Mock private PasswordEncoder passwordEncoder;
    @Mock private AuthenticationManager authenticationManager;
    @Mock private MinioService minioService;
    @Mock private ValueOperations<String, Object> valueOperations;

    private User testUser;
    private Employee testEmployee;
    private UserPrincipal testPrincipal;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(authService, "jwtExpirationMs", 3600000L);
        ReflectionTestUtils.setField(authService, "refreshExpirationMs", 86400000L);
        ReflectionTestUtils.setField(authService, "avatarBucket", "test-avatars");

        testEmployee = TestFixtures.defaultEmployee();
        testUser = TestFixtures.employeeUser();
        testUser.setEmployee(testEmployee);
        testPrincipal = TestFixtures.createUserPrincipal(testUser);
    }

    @Nested
    @DisplayName("login")
    class Login {

        @Test
        @DisplayName("Đăng nhập thành công — trả về tokens và user info")
        void login_Success() {
            LoginRequest request = new LoginRequest("employee1", "password");
            Authentication auth = mock(Authentication.class);

            when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class)))
                    .thenReturn(auth);
            when(auth.getPrincipal()).thenReturn(testPrincipal);
            when(userRepository.findByUsername("employee1")).thenReturn(Optional.of(testUser));
            when(userRepository.save(any(User.class))).thenReturn(testUser);
            when(jwtService.generateToken(testPrincipal)).thenReturn("jwt-access-token");
            when(redisTemplate.opsForValue()).thenReturn(valueOperations);

            LoginResponse response = authService.login(request);

            assertThat(response.accessToken()).isEqualTo("jwt-access-token");
            assertThat(response.refreshToken()).isNotBlank();
            assertThat(response.tokenType()).isEqualTo("Bearer");
            assertThat(response.expiresIn()).isEqualTo(3600L);
            assertThat(response.user()).isNotNull();
            assertThat(response.user().getUsername()).isEqualTo("employee1");

            verify(userRepository).save(any(User.class)); // lastLogin updated
            verify(valueOperations).set(anyString(), eq("employee1"), eq(86400000L), eq(TimeUnit.MILLISECONDS));
        }

        @Test
        @DisplayName("Đăng nhập thất bại — sai mật khẩu → BadCredentialsException")
        void login_InvalidCredentials_ThrowsBadCredentials() {
            LoginRequest request = new LoginRequest("employee1", "wrongPassword");

            when(authenticationManager.authenticate(any()))
                    .thenThrow(new BadCredentialsException("Bad credentials"));

            assertThatThrownBy(() -> authService.login(request))
                    .isInstanceOf(BadCredentialsException.class);
        }

        @Test
        @DisplayName("Đăng nhập — user không tồn tại → ResourceNotFoundException")
        void login_UserNotFound_ThrowsResourceNotFoundException() {
            LoginRequest request = new LoginRequest("nonexistent", "password");
            Authentication auth = mock(Authentication.class);

            when(authenticationManager.authenticate(any())).thenReturn(auth);
            when(auth.getPrincipal()).thenReturn(testPrincipal);
            when(userRepository.findByUsername("nonexistent")).thenReturn(Optional.empty());

            assertThatThrownBy(() -> authService.login(request))
                    .isInstanceOf(ResourceNotFoundException.class);
        }

        @Test
        @DisplayName("Đăng nhập — user có avatar → sinh presigned URL")
        void login_WithAvatar_GeneratesPresignedUrl() {
            LoginRequest request = new LoginRequest("employee1", "password");
            testEmployee.setAvatarUrl("avatar.jpg");
            Authentication auth = mock(Authentication.class);

            when(authenticationManager.authenticate(any())).thenReturn(auth);
            when(auth.getPrincipal()).thenReturn(testPrincipal);
            when(userRepository.findByUsername("employee1")).thenReturn(Optional.of(testUser));
            when(userRepository.save(any(User.class))).thenReturn(testUser);
            when(jwtService.generateToken(any())).thenReturn("token");
            when(redisTemplate.opsForValue()).thenReturn(valueOperations);
            when(minioService.getPresignedUrl("test-avatars", "avatar.jpg", 900))
                    .thenReturn("https://minio/presigned-url");

            LoginResponse response = authService.login(request);

            assertThat(response.user().getAvatarUrl()).isEqualTo("https://minio/presigned-url");
        }

        @Test
        @DisplayName("Đăng nhập — user không liên kết employee → employeeId null")
        void login_WithoutEmployee_EmployeeIdNull() {
            testUser.setEmployee(null);
            LoginRequest request = new LoginRequest("employee1", "password");
            Authentication auth = mock(Authentication.class);

            when(authenticationManager.authenticate(any())).thenReturn(auth);
            when(auth.getPrincipal()).thenReturn(testPrincipal);
            when(userRepository.findByUsername("employee1")).thenReturn(Optional.of(testUser));
            when(userRepository.save(any(User.class))).thenReturn(testUser);
            when(jwtService.generateToken(any())).thenReturn("token");
            when(redisTemplate.opsForValue()).thenReturn(valueOperations);

            LoginResponse response = authService.login(request);

            assertThat(response.user().getEmployeeId()).isNull();
        }
    }

    @Nested
    @DisplayName("refresh")
    class Refresh {

        @Test
        @DisplayName("Refresh token thành công → trả về access token mới")
        void refresh_Success() {
            RefreshTokenRequest request = new RefreshTokenRequest("valid-refresh-token");

            when(redisTemplate.opsForValue()).thenReturn(valueOperations);
            when(valueOperations.get("rt:valid-refresh-token")).thenReturn("employee1");
            when(userDetailsService.loadUserByUsername("employee1")).thenReturn(testPrincipal);
            when(jwtService.generateToken(testPrincipal)).thenReturn("new-access-token");

            RefreshTokenResponse response = authService.refresh(request);

            assertThat(response.accessToken()).isEqualTo("new-access-token");
            assertThat(response.tokenType()).isEqualTo("Bearer");
            assertThat(response.expiresIn()).isEqualTo(3600L);
        }

        @Test
        @DisplayName("Refresh token không hợp lệ → AppException UNAUTHORIZED")
        void refresh_InvalidToken_ThrowsUnauthorized() {
            RefreshTokenRequest request = new RefreshTokenRequest("invalid-token");

            when(redisTemplate.opsForValue()).thenReturn(valueOperations);
            when(valueOperations.get("rt:invalid-token")).thenReturn(null);

            assertThatThrownBy(() -> authService.refresh(request))
                    .isInstanceOf(AppException.class)
                    .hasMessageContaining("không hợp lệ");
        }
    }

    @Nested
    @DisplayName("logout")
    class Logout {

        @Test
        @DisplayName("Logout thành công — xóa refresh token khỏi Redis")
        void logout_Success() {
            RefreshTokenRequest request = new RefreshTokenRequest("valid-refresh-token");
            when(redisTemplate.delete("rt:valid-refresh-token")).thenReturn(true);

            authService.logout(request);

            verify(redisTemplate).delete("rt:valid-refresh-token");
        }

        @Test
        @DisplayName("Logout — token không tồn tại trong Redis → vẫn không throw")
        void logout_TokenNotFound_DoesNotThrow() {
            RefreshTokenRequest request = new RefreshTokenRequest("missing-token");
            when(redisTemplate.delete("rt:missing-token")).thenReturn(false);

            assertThatCode(() -> authService.logout(request))
                    .doesNotThrowAnyException();
        }
    }

    @Nested
    @DisplayName("changePassword")
    class ChangePassword {

        @Test
        @DisplayName("Đổi mật khẩu thành công")
        void changePassword_Success() {
            ChangePasswordRequest request = new ChangePasswordRequest("oldPass", "newPass123");

            // Setup SecurityContext
            Authentication authentication = mock(Authentication.class);
            when(authentication.getName()).thenReturn("employee1");
            SecurityContext securityContext = mock(SecurityContext.class);
            when(securityContext.getAuthentication()).thenReturn(authentication);
            SecurityContextHolder.setContext(securityContext);

            when(userRepository.findByUsername("employee1")).thenReturn(Optional.of(testUser));
            when(passwordEncoder.matches("oldPass", testUser.getPassword())).thenReturn(true);
            when(passwordEncoder.encode("newPass123")).thenReturn("$2a$12$encodedNewPassword");

            authService.changePassword(request);

            verify(userRepository).save(testUser);
            verify(passwordEncoder).encode("newPass123");
        }

        @Test
        @DisplayName("Đổi mật khẩu — sai mật khẩu hiện tại → AppException")
        void changePassword_WrongCurrentPassword_ThrowsAppException() {
            ChangePasswordRequest request = new ChangePasswordRequest("wrongOldPass", "newPass123");

            Authentication authentication = mock(Authentication.class);
            when(authentication.getName()).thenReturn("employee1");
            SecurityContext securityContext = mock(SecurityContext.class);
            when(securityContext.getAuthentication()).thenReturn(authentication);
            SecurityContextHolder.setContext(securityContext);

            when(userRepository.findByUsername("employee1")).thenReturn(Optional.of(testUser));
            when(passwordEncoder.matches("wrongOldPass", testUser.getPassword())).thenReturn(false);

            assertThatThrownBy(() -> authService.changePassword(request))
                    .isInstanceOf(AppException.class)
                    .hasMessageContaining("không chính xác");
        }
    }
}
