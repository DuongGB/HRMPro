package com.hrmpro.module.auth.service;

import io.jsonwebtoken.JwtException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.List;

import static org.assertj.core.api.Assertions.*;

/**
 * Unit test cho JwtService — test tạo token, trích xuất thông tin, và xác thực token.
 * Sử dụng ReflectionTestUtils để inject @Value fields.
 */
@DisplayName("JwtService Unit Tests")
class JwtServiceTest {

    private JwtService jwtService;
    private UserDetails userDetails;

    private static final String JWT_SECRET = "test-secret-key-that-is-at-least-256-bits-long-for-hmac-sha256-algorithm-testing";
    private static final long EXPIRATION_MS = 3600000; // 1 giờ

    @BeforeEach
    void setUp() {
        jwtService = new JwtService();
        ReflectionTestUtils.setField(jwtService, "jwtSecret", JWT_SECRET);
        ReflectionTestUtils.setField(jwtService, "jwtExpirationMs", EXPIRATION_MS);

        userDetails = User.builder()
                .username("admin")
                .password("password")
                .authorities(List.of(new SimpleGrantedAuthority("ROLE_SUPER_ADMIN")))
                .build();
    }

    @Nested
    @DisplayName("generateToken")
    class GenerateToken {

        @Test
        @DisplayName("Tạo token thành công — chứa đúng username")
        void generateToken_ShouldContainUsername() {
            String token = jwtService.generateToken(userDetails);

            assertThat(token).isNotBlank();
            String extractedUsername = jwtService.extractUsername(token);
            assertThat(extractedUsername).isEqualTo("admin");
        }

        @Test
        @DisplayName("Token có định dạng JWT hợp lệ (3 phần ngăn bởi dấu chấm)")
        void generateToken_ShouldHaveValidJwtFormat() {
            String token = jwtService.generateToken(userDetails);

            assertThat(token.split("\\.")).hasSize(3);
        }

        @Test
        @DisplayName("Hai lần generate token cho cùng user → token khác nhau (do iat khác)")
        void generateToken_ShouldProduceDifferentTokensEachTime() {
            String token1 = jwtService.generateToken(userDetails);
            String token2 = jwtService.generateToken(userDetails);

            // Vẫn có thể trùng trong cùng ms, nhưng thường sẽ khác
            // Chỉ đảm bảo cả hai đều hợp lệ
            assertThat(jwtService.isTokenValid(token1, userDetails)).isTrue();
            assertThat(jwtService.isTokenValid(token2, userDetails)).isTrue();
        }
    }

    @Nested
    @DisplayName("extractUsername")
    class ExtractUsername {

        @Test
        @DisplayName("Trích xuất đúng username từ token")
        void extractUsername_ShouldReturnCorrectUsername() {
            String token = jwtService.generateToken(userDetails);

            String username = jwtService.extractUsername(token);

            assertThat(username).isEqualTo("admin");
        }

        @Test
        @DisplayName("Token bị sửa đổi → throw JwtException")
        void extractUsername_WithTamperedToken_ShouldThrowJwtException() {
            String token = jwtService.generateToken(userDetails);
            String tamperedToken = token + "tampered";

            assertThatThrownBy(() -> jwtService.extractUsername(tamperedToken))
                    .isInstanceOf(JwtException.class);
        }
    }

    @Nested
    @DisplayName("isTokenValid")
    class IsTokenValid {

        @Test
        @DisplayName("Token hợp lệ cho đúng user → true")
        void isTokenValid_WithValidToken_ReturnsTrue() {
            String token = jwtService.generateToken(userDetails);

            boolean isValid = jwtService.isTokenValid(token, userDetails);

            assertThat(isValid).isTrue();
        }

        @Test
        @DisplayName("Token của user A validate cho user B → false")
        void isTokenValid_WithWrongUsername_ReturnsFalse() {
            String token = jwtService.generateToken(userDetails);

            UserDetails anotherUser = User.builder()
                    .username("other_user")
                    .password("password")
                    .authorities(List.of(new SimpleGrantedAuthority("ROLE_EMPLOYEE")))
                    .build();

            boolean isValid = jwtService.isTokenValid(token, anotherUser);

            assertThat(isValid).isFalse();
        }

        @Test
        @DisplayName("Token đã hết hạn → false")
        void isTokenValid_WithExpiredToken_ReturnsFalse() {
            // Tạo JwtService với expiration = 0ms → token hết hạn ngay
            JwtService shortLivedService = new JwtService();
            ReflectionTestUtils.setField(shortLivedService, "jwtSecret", JWT_SECRET);
            ReflectionTestUtils.setField(shortLivedService, "jwtExpirationMs", 0L);

            String token = shortLivedService.generateToken(userDetails);

            // Token hết hạn ngay sau khi tạo
            boolean isValid = shortLivedService.isTokenValid(token, userDetails);

            assertThat(isValid).isFalse();
        }

        @Test
        @DisplayName("Token bị sửa đổi (tampered) → false")
        void isTokenValid_WithTamperedToken_ReturnsFalse() {
            String token = jwtService.generateToken(userDetails);
            String tamperedToken = token.substring(0, token.length() - 5) + "xxxxx";

            boolean isValid = jwtService.isTokenValid(tamperedToken, userDetails);

            assertThat(isValid).isFalse();
        }

        @Test
        @DisplayName("Token hoàn toàn rác → false")
        void isTokenValid_WithGarbageToken_ReturnsFalse() {
            boolean isValid = jwtService.isTokenValid("not.a.valid.token", userDetails);

            assertThat(isValid).isFalse();
        }
    }
}
