package com.hrmpro.module.auth.service;

import com.hrmpro.common.dto.PageResponse;
import com.hrmpro.common.exception.AppException;
import com.hrmpro.common.exception.ResourceNotFoundException;
import com.hrmpro.module.auth.dto.PasswordResetRequest;
import com.hrmpro.module.auth.dto.UpdateRolesRequest;
import com.hrmpro.module.auth.dto.UserCreateRequest;
import com.hrmpro.module.auth.dto.UserResponse;
import com.hrmpro.module.auth.entity.Role;
import com.hrmpro.module.auth.entity.User;
import com.hrmpro.module.auth.enums.RoleType;
import com.hrmpro.module.auth.repository.RoleRepository;
import com.hrmpro.module.auth.repository.UserRepository;
import com.hrmpro.module.employee.entity.Employee;
import com.hrmpro.module.employee.repository.EmployeeRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class UserService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final EmployeeRepository employeeRepository;
    private final PasswordEncoder passwordEncoder;

    /**
     * Lấy danh sách tài khoản người dùng có phân trang
     */
    @Transactional(readOnly = true)
    public PageResponse<UserResponse> getUsers(Pageable pageable) {
        Page<User> userPage = userRepository.findAll(pageable);
        List<UserResponse> content = userPage.getContent().stream()
                .map(this::convertToUserResponse)
                .collect(Collectors.toList());

        return new PageResponse<>(
                content,
                userPage.getNumber(),
                userPage.getSize(),
                userPage.getTotalElements(),
                userPage.getTotalPages()
        );
    }

    /**
     * Tạo tài khoản người dùng mới (chỉ SUPER_ADMIN)
     */
    @Transactional
    public UserResponse createUser(UserCreateRequest request) {
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new AppException("Tên đăng nhập '" + request.getUsername() + "' đã tồn tại", HttpStatus.BAD_REQUEST);
        }

        Employee employee = null;
        if (request.getEmployeeId() != null) {
            employee = employeeRepository.findById(request.getEmployeeId())
                    .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy nhân viên với ID: " + request.getEmployeeId()));

            if (userRepository.existsByEmployeeId(request.getEmployeeId())) {
                throw new AppException("Nhân viên này đã được liên kết với một tài khoản người dùng khác", HttpStatus.BAD_REQUEST);
            }
        }

        // Lấy các Role từ DB
        Set<Role> roles = new HashSet<>();
        for (String roleName : request.getRoles()) {
            try {
                RoleType roleType = RoleType.valueOf(roleName.toUpperCase());
                Role role = roleRepository.findByName(roleType)
                        .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy vai trò: " + roleName));
                roles.add(role);
            } catch (IllegalArgumentException e) {
                throw new AppException("Vai trò không hợp lệ: " + roleName, HttpStatus.BAD_REQUEST);
            }
        }

        User user = User.builder()
                .username(request.getUsername())
                .password(passwordEncoder.encode(request.getPassword()))
                .employee(employee)
                .roles(roles)
                .isActive(true)
                .build();

        User savedUser = userRepository.save(user);
        log.info("Đã tạo người dùng mới: {} với các vai trò: {}", savedUser.getUsername(), request.getRoles());
        return convertToUserResponse(savedUser);
    }

    /**
     * Thay đổi trạng thái tài khoản (Khóa/Mở khóa)
     */
    @Transactional
    public UserResponse toggleUserStatus(Long id, Boolean isActive) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy người dùng với ID: " + id));

        user.setIsActive(isActive);
        User updatedUser = userRepository.save(user);
        log.info("Đã cập nhật trạng thái hoạt động của tài khoản {} thành {}", updatedUser.getUsername(), isActive);
        return convertToUserResponse(updatedUser);
    }

    /**
     * Reset mật khẩu người dùng (chỉ SUPER_ADMIN)
     */
    @Transactional
    public void resetPassword(Long id, PasswordResetRequest request) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy người dùng với ID: " + id));

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
        log.info("Đã đặt lại mật khẩu cho người dùng: {}", user.getUsername());
    }

    /**
     * Cập nhật vai trò (roles) cho người dùng (chỉ SUPER_ADMIN)
     */
    @Transactional
    public UserResponse updateUserRoles(Long id, UpdateRolesRequest request) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy người dùng với ID: " + id));

        // Resolve các RoleType từ tên string
        Set<Role> newRoles = new HashSet<>();
        for (String roleName : request.getRoles()) {
            try {
                RoleType roleType = RoleType.valueOf(roleName.toUpperCase());
                Role role = roleRepository.findByName(roleType)
                        .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy vai trò: " + roleName));
                newRoles.add(role);
            } catch (IllegalArgumentException e) {
                throw new AppException("Vai trò không hợp lệ: " + roleName, HttpStatus.BAD_REQUEST);
            }
        }

        user.getRoles().clear();
        user.getRoles().addAll(newRoles);
        User updatedUser = userRepository.save(user);

        log.info("Đã cập nhật vai trò của người dùng {} thành: {}", user.getUsername(), request.getRoles());
        return convertToUserResponse(updatedUser);
    }


    /**
     * Helper mapping entity sang response DTO
     */
    private UserResponse convertToUserResponse(User user) {
        String employeeCode = null;
        String employeeName = null;
        if (user.getEmployee() != null) {
            employeeCode = user.getEmployee().getEmployeeCode();
            employeeName = user.getEmployee().getFullName();
        }

        Set<String> roleNames = user.getRoles().stream()
                .map(role -> role.getName().name())
                .collect(Collectors.toSet());

        return UserResponse.builder()
                .id(user.getId())
                .username(user.getUsername())
                .employeeId(user.getEmployee() != null ? user.getEmployee().getId() : null)
                .employeeCode(employeeCode)
                .employeeName(employeeName)
                .isActive(user.getIsActive())
                .roles(roleNames)
                .createdAt(user.getCreatedAt())
                .build();
    }
}
