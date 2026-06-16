package com.hrmpro.module.auth.service;

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

    @Value("${app.jwt.expiration-ms}")
    private long jwtExpirationMs;

    @Value("${app.jwt.refresh-expiration-ms}")
    private long refreshExpirationMs;

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

        UserResponse userResponse = UserResponse.builder()
                .id(user.getId())
                .username(user.getUsername())
                .roles(roles.stream().collect(Collectors.toSet()))
                .employeeId(employeeId)
                .employeeCode(employeeCode)
                .employeeName(employeeName)
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
}
