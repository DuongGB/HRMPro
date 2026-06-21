package com.hrmpro.module.auth.service;

import com.hrmpro.common.service.MinioService;
import com.hrmpro.common.service.EmailService;
import com.hrmpro.common.exception.AppException;
import com.hrmpro.common.exception.ResourceNotFoundException;
import com.hrmpro.module.auth.dto.*;
import com.hrmpro.module.auth.entity.Role;
import com.hrmpro.module.auth.entity.User;
import com.hrmpro.module.auth.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.TimeUnit;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthService {

    private final UserRepository userRepository;
    private final CustomUserDetailsService userDetailsService;
    private final JwtService jwtService;
    private final RedisTemplate<String, Object> redisTemplate;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final MinioService minioService;
    private final EmailService emailService;

    @Value("${app.jwt.expiration-ms}")
    private long jwtExpirationMs;

    @Value("${app.jwt.refresh-expiration-ms}")
    private long refreshExpirationMs;

    @Value("${app.minio.bucket.avatars}")
    private String avatarBucket;

    @Transactional
    public LoginResponse login(LoginRequest request) {
        log.info("Đăng nhập người dùng: {}", request.username());
        
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.username(), request.password())
        );

        SecurityContextHolder.getContext().setAuthentication(authentication);
        UserDetails userDetails = (UserDetails) authentication.getPrincipal();
        
        User user = userRepository.findByUsername(request.username())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy tài khoản người dùng"));

        // Cập nhật thời gian đăng nhập cuối cùng
        user.setLastLogin(LocalDateTime.now());
        userRepository.save(user);

        // Tạo access token
        String accessToken = jwtService.generateToken(userDetails);
        
        // Tạo refresh token ngẫu nhiên và lưu vào Redis
        String refreshToken = UUID.randomUUID().toString();
        String redisKey = "rt:" + refreshToken;
        redisTemplate.opsForValue().set(redisKey, user.getUsername(), refreshExpirationMs, TimeUnit.MILLISECONDS);

        List<String> roles = user.getRoles().stream()
                .map(role -> role.getName().name())
                .collect(Collectors.toList());

        Long employeeId = user.getEmployee() != null ? user.getEmployee().getId() : null;
        String employeeCode = user.getEmployee() != null ? user.getEmployee().getEmployeeCode() : null;
        String employeeName = user.getEmployee() != null ? user.getEmployee().getFullName() : null;

        String avatarUrl = null;
        if (user.getEmployee() != null && user.getEmployee().getAvatarUrl() != null) {
            try {
                avatarUrl = minioService.getPresignedUrl(avatarBucket, user.getEmployee().getAvatarUrl(), 900);
            } catch (Exception e) {
                log.error("Lỗi sinh presigned URL cho avatar người dùng khi login: ", e);
                avatarUrl = user.getEmployee().getAvatarUrl();
            }
        }

        UserResponse userResponse = UserResponse.builder()
                .id(user.getId())
                .username(user.getUsername())
                .roles(roles.stream().collect(Collectors.toSet()))
                .employeeId(employeeId)
                .employeeCode(employeeCode)
                .employeeName(employeeName)
                .avatarUrl(avatarUrl)
                .isActive(user.getIsActive())
                .createdAt(user.getCreatedAt())
                .build();

        return new LoginResponse(
                accessToken,
                refreshToken,
                "Bearer",
                jwtExpirationMs / 1000, // đổi sang giây
                userResponse
        );
    }

    public RefreshTokenResponse refresh(RefreshTokenRequest request) {
        String refreshToken = request.refreshToken();
        String redisKey = "rt:" + refreshToken;
        
        String username = (String) redisTemplate.opsForValue().get(redisKey);
        if (username == null) {
            log.warn("Refresh token không hợp lệ hoặc đã hết hạn: {}", refreshToken);
            throw new AppException("Refresh token không hợp lệ hoặc đã hết hạn", HttpStatus.UNAUTHORIZED);
        }

        UserDetails userDetails = userDetailsService.loadUserByUsername(username);
        String newAccessToken = jwtService.generateToken(userDetails);

        return new RefreshTokenResponse(
                newAccessToken,
                "Bearer",
                jwtExpirationMs / 1000
        );
    }

    public void logout(RefreshTokenRequest request) {
        String refreshToken = request.refreshToken();
        String redisKey = "rt:" + refreshToken;
        Boolean deleted = redisTemplate.delete(redisKey);
        if (Boolean.TRUE.equals(deleted)) {
            log.info("Đã xóa refresh token khỏi Redis: {}", refreshToken);
        } else {
            log.warn("Không tìm thấy refresh token trong Redis khi logout: {}", refreshToken);
        }
        SecurityContextHolder.clearContext();
    }

    @Transactional
    public void changePassword(ChangePasswordRequest request) {
        String currentUsername = SecurityContextHolder.getContext().getAuthentication().getName();
        log.info("Đổi mật khẩu cho người dùng: {}", currentUsername);

        User user = userRepository.findByUsername(currentUsername)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy tài khoản người dùng"));

        if (!passwordEncoder.matches(request.currentPassword(), user.getPassword())) {
            throw new AppException("Mật khẩu hiện tại không chính xác", HttpStatus.BAD_REQUEST);
        }

        user.setPassword(passwordEncoder.encode(request.newPassword()));
        userRepository.save(user);
    }

    private String hashToken(String token) {
        try {
            java.security.MessageDigest digest = java.security.MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(token.getBytes(java.nio.charset.StandardCharsets.UTF_8));
            StringBuilder hexString = new StringBuilder();
            for (byte b : hash) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) hexString.append('0');
                hexString.append(hex);
            }
            return hexString.toString();
        } catch (Exception e) {
            log.error("Lỗi băm token khôi phục mật khẩu: ", e);
            return token;
        }
    }

    @Transactional
    public void forgotPassword(ForgotPasswordRequest request) {
        log.info("Yêu cầu khôi phục mật khẩu cho email: {}", request.email());
        
        User user = userRepository.findByEmployeeEmail(request.email())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy tài khoản liên kết với email này"));

        if (!user.getIsActive()) {
            throw new AppException("Tài khoản của bạn đã bị khóa", HttpStatus.BAD_REQUEST);
        }

        // Tạo token ngẫu nhiên và thời gian hết hạn (15 phút sau)
        String token = UUID.randomUUID().toString();
        user.setResetToken(hashToken(token));
        user.setResetTokenExpiry(LocalDateTime.now().plusMinutes(15));
        userRepository.save(user);

        // Gửi email khôi phục mật khẩu với token gốc
        String resetUrl = "http://localhost:5173/reset-password?token=" + token;
        
        String subject = "[HRMPro] Yêu cầu khôi phục mật khẩu tài khoản";
        String content = "Chào " + user.getEmployee().getFullName() + ",\n\n" +
                "Bạn đã yêu cầu khôi phục mật khẩu cho tài khoản HRMPro của mình.\n" +
                "Vui lòng nhấn vào đường dẫn dưới đây để đặt lại mật khẩu mới (Đường dẫn có hiệu lực trong 15 phút):\n\n" +
                resetUrl + "\n\n" +
                "Nếu bạn không thực hiện yêu cầu này, vui lòng bỏ qua email này.\n\n" +
                "Trân trọng,\n" +
                "Đội ngũ HRMPro";

        emailService.sendEmail(request.email(), subject, content);
    }

    @Transactional
    public void resetPassword(ResetPasswordRequest request) {
        log.info("Thực hiện khôi phục mật khẩu bằng token");

        String hashedToken = hashToken(request.token());
        User user = userRepository.findByResetToken(hashedToken)
                .orElseThrow(() -> new AppException("Token khôi phục mật khẩu không hợp lệ hoặc đã được sử dụng", HttpStatus.BAD_REQUEST));

        if (user.getResetTokenExpiry() == null || user.getResetTokenExpiry().isBefore(LocalDateTime.now())) {
            throw new AppException("Token khôi phục mật khẩu đã hết hạn", HttpStatus.BAD_REQUEST);
        }

        // Đổi mật khẩu mới và xóa token
        user.setPassword(passwordEncoder.encode(request.newPassword()));
        user.setResetToken(null);
        user.setResetTokenExpiry(null);
        userRepository.save(user);
    }
}
