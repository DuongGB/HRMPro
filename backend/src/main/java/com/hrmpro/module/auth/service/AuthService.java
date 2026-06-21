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
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

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

    private String getClientIp() {
        ServletRequestAttributes attributes = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
        if (attributes != null) {
            HttpServletRequest request = attributes.getRequest();
            String xfHeader = request.getHeader("X-Forwarded-For");
            if (xfHeader == null || xfHeader.isEmpty()) {
                return request.getRemoteAddr();
            }
            return xfHeader.split(",")[0].trim();
        }
        return "unknown";
    }

    @Transactional
    public LoginResponse login(LoginRequest request) {
        log.info("Đăng nhập người dùng: {}", request.username());
        
        String username = request.username();
        String ip = getClientIp();
        String attemptsKey = "login_attempts:" + username;
        String lockKey = "login_lock:" + username;
        String ipAttemptsKey = "login_attempts_ip:" + ip;
        String ipLockKey = "login_lock_ip:" + ip;

        // 1. Kiểm tra xem IP có đang bị tạm khóa 15 phút do brute-force diện rộng hay không
        if (Boolean.TRUE.equals(redisTemplate.hasKey(ipLockKey))) {
            throw new AppException("Địa chỉ IP của bạn bị tạm khóa trong 15 phút do nghi ngờ tấn công Brute-force. Vui lòng thử lại sau.", HttpStatus.BAD_REQUEST);
        }

        // 2. Kiểm tra xem tài khoản có đang bị khóa 10 phút hay không
        if (Boolean.TRUE.equals(redisTemplate.hasKey(lockKey))) {
            throw new AppException("Tài khoản của bạn đã bị khóa tạm thời trong 10 phút do nhập sai mật khẩu quá 5 lần. Vui lòng thử lại sau.", HttpStatus.BAD_REQUEST);
        }

        Authentication authentication;
        try {
            authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(username, request.password())
            );
            
            // Đăng nhập thành công -> Xóa bộ đếm số lần thử sai
            redisTemplate.delete(attemptsKey);
            redisTemplate.delete(ipAttemptsKey);
        } catch (BadCredentialsException e) {
            // Tăng bộ đếm thử sai của IP
            Integer ipAttempts = (Integer) redisTemplate.opsForValue().get(ipAttemptsKey);
            if (ipAttempts == null) {
                ipAttempts = 0;
            }
            ipAttempts++;
            if (ipAttempts >= 10) {
                // Sai quá 10 lần từ 1 IP ở các tài khoản khác nhau -> Khóa IP 15 phút
                redisTemplate.opsForValue().set(ipLockKey, "locked", 15, TimeUnit.MINUTES);
                redisTemplate.delete(ipAttemptsKey);
            } else {
                redisTemplate.opsForValue().set(ipAttemptsKey, ipAttempts, 30, TimeUnit.MINUTES);
            }

            // Lấy số lần thử sai hiện tại từ Redis
            Integer attempts = (Integer) redisTemplate.opsForValue().get(attemptsKey);
            if (attempts == null) {
                attempts = 0;
            }
            attempts++;

            if (attempts >= 5) {
                // Đạt 5 lần sai -> Khóa 10 phút
                redisTemplate.opsForValue().set(lockKey, "locked", 10, TimeUnit.MINUTES);
                redisTemplate.delete(attemptsKey);
                throw new AppException("Tài khoản của bạn đã bị khóa tạm thời trong 10 phút do nhập sai mật khẩu quá 5 lần. Vui lòng thử lại sau.", HttpStatus.BAD_REQUEST);
            } else {
                // Lưu lại số lần thử sai (hết hạn sau 30 phút)
                redisTemplate.opsForValue().set(attemptsKey, attempts, 30, TimeUnit.MINUTES);
                int remaining = 5 - attempts;
                throw new AppException("Tên đăng nhập hoặc mật khẩu không chính xác. Bạn còn " + remaining + " lần thử.", HttpStatus.BAD_REQUEST);
            }
        }

        SecurityContextHolder.getContext().setAuthentication(authentication);
        UserDetails userDetails = (UserDetails) authentication.getPrincipal();
        
        User user = userRepository.findByUsername(username)
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
        
        String ip = getClientIp();
        String email = request.email();

        String ipRateKey = "rate_limit:forgot_password:ip:" + ip;
        String emailRateKey = "rate_limit:forgot_password:email:" + email;

        // 1. Kiểm tra giới hạn của IP (tối đa 3 lần trong 15 phút)
        Integer ipCount = (Integer) redisTemplate.opsForValue().get(ipRateKey);
        if (ipCount != null && ipCount >= 3) {
            throw new AppException("Bạn đã yêu cầu khôi phục mật khẩu quá số lần cho phép từ địa chỉ IP này. Vui lòng thử lại sau 15 phút.", HttpStatus.TOO_MANY_REQUESTS);
        }

        // 2. Tìm người dùng liên kết với email
        User user = userRepository.findByEmployeeEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy tài khoản liên kết với email này"));

        if (!user.getIsActive()) {
            throw new AppException("Tài khoản của bạn đã bị khóa", HttpStatus.BAD_REQUEST);
        }

        // 3. Kiểm tra giới hạn của Email (tối đa 2 lần trong 15 phút)
        Integer emailCount = (Integer) redisTemplate.opsForValue().get(emailRateKey);
        if (emailCount != null && emailCount >= 2) {
            throw new AppException("Địa chỉ email này đã nhận quá số lượng yêu cầu khôi phục mật khẩu cho phép. Vui lòng thử lại sau 15 phút.", HttpStatus.TOO_MANY_REQUESTS);
        }

        // 4. Tăng bộ đếm và lưu Redis
        if (ipCount == null) {
            redisTemplate.opsForValue().set(ipRateKey, 1, 15, TimeUnit.MINUTES);
        } else {
            redisTemplate.opsForValue().increment(ipRateKey);
        }

        if (emailCount == null) {
            redisTemplate.opsForValue().set(emailRateKey, 1, 15, TimeUnit.MINUTES);
        } else {
            redisTemplate.opsForValue().increment(emailRateKey);
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
