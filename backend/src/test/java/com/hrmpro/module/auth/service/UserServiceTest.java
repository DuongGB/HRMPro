package com.hrmpro.module.auth.service;

import com.hrmpro.common.exception.AppException;
import com.hrmpro.common.exception.ResourceNotFoundException;
import com.hrmpro.common.service.MinioService;
import com.hrmpro.module.auth.dto.*;
import com.hrmpro.module.auth.entity.Role;
import com.hrmpro.module.auth.entity.User;
import com.hrmpro.module.auth.enums.RoleType;
import com.hrmpro.module.auth.repository.RoleRepository;
import com.hrmpro.module.auth.repository.UserRepository;
import com.hrmpro.module.employee.entity.Employee;
import com.hrmpro.module.employee.repository.EmployeeRepository;
import com.hrmpro.util.TestFixtures;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.*;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.*;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("UserService Unit Tests")
class UserServiceTest {

    @InjectMocks
    private UserService userService;

    @Mock private UserRepository userRepository;
    @Mock private RoleRepository roleRepository;
    @Mock private EmployeeRepository employeeRepository;
    @Mock private PasswordEncoder passwordEncoder;
    @Mock private MinioService minioService;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(userService, "avatarBucket", "test-avatars");
    }

    @Nested
    @DisplayName("getUsers")
    class GetUsers {

        @Test
        @DisplayName("Lấy danh sách users phân trang thành công")
        void getUsers_ReturnsPaginatedResponse() {
            User user = TestFixtures.adminUser();
            Page<User> page = new PageImpl<>(List.of(user), PageRequest.of(0, 10), 1);
            when(userRepository.findAll(any(Pageable.class))).thenReturn(page);

            var result = userService.getUsers(PageRequest.of(0, 10));

            assertThat(result.content()).hasSize(1);
            assertThat(result.totalElements()).isEqualTo(1);
            assertThat(result.content().get(0).getUsername()).isEqualTo("admin");
        }
    }

    @Nested
    @DisplayName("createUser")
    class CreateUser {

        @Test
        @DisplayName("Tạo user thành công")
        void createUser_Success() {
            UserCreateRequest request = UserCreateRequest.builder()
                    .username("newuser")
                    .password("password123")
                    .roles(Set.of("EMPLOYEE"))
                    .build();

            Role employeeRole = TestFixtures.employeeRole();

            when(userRepository.existsByUsername("newuser")).thenReturn(false);
            when(roleRepository.findByName(RoleType.EMPLOYEE)).thenReturn(Optional.of(employeeRole));
            when(passwordEncoder.encode("password123")).thenReturn("$2a$12$encoded");
            when(userRepository.save(any(User.class))).thenAnswer(inv -> {
                User u = inv.getArgument(0);
                u.setId(10L);
                return u;
            });

            UserResponse response = userService.createUser(request);

            assertThat(response.getUsername()).isEqualTo("newuser");
            verify(userRepository).save(any(User.class));
        }

        @Test
        @DisplayName("Tạo user với employee liên kết")
        void createUser_WithEmployee_Success() {
            Employee emp = TestFixtures.defaultEmployee();
            UserCreateRequest request = UserCreateRequest.builder()
                    .username("newuser")
                    .password("password123")
                    .employeeId(1L)
                    .roles(Set.of("EMPLOYEE"))
                    .build();

            when(userRepository.existsByUsername("newuser")).thenReturn(false);
            when(employeeRepository.findById(1L)).thenReturn(Optional.of(emp));
            when(userRepository.existsByEmployeeId(1L)).thenReturn(false);
            when(roleRepository.findByName(RoleType.EMPLOYEE)).thenReturn(Optional.of(TestFixtures.employeeRole()));
            when(passwordEncoder.encode(any())).thenReturn("$2a$12$encoded");
            when(userRepository.save(any(User.class))).thenAnswer(inv -> {
                User u = inv.getArgument(0);
                u.setId(10L);
                return u;
            });

            UserResponse response = userService.createUser(request);

            assertThat(response.getEmployeeId()).isEqualTo(1L);
        }

        @Test
        @DisplayName("Username trùng → AppException")
        void createUser_DuplicateUsername_ThrowsAppException() {
            UserCreateRequest request = UserCreateRequest.builder()
                    .username("admin")
                    .password("password123")
                    .roles(Set.of("EMPLOYEE"))
                    .build();

            when(userRepository.existsByUsername("admin")).thenReturn(true);

            assertThatThrownBy(() -> userService.createUser(request))
                    .isInstanceOf(AppException.class)
                    .hasMessageContaining("đã tồn tại");
        }

        @Test
        @DisplayName("Employee đã liên kết user khác → AppException")
        void createUser_EmployeeAlreadyLinked_ThrowsAppException() {
            UserCreateRequest request = UserCreateRequest.builder()
                    .username("newuser")
                    .password("password123")
                    .employeeId(1L)
                    .roles(Set.of("EMPLOYEE"))
                    .build();

            when(userRepository.existsByUsername("newuser")).thenReturn(false);
            when(employeeRepository.findById(1L)).thenReturn(Optional.of(TestFixtures.defaultEmployee()));
            when(userRepository.existsByEmployeeId(1L)).thenReturn(true);

            assertThatThrownBy(() -> userService.createUser(request))
                    .isInstanceOf(AppException.class)
                    .hasMessageContaining("đã được liên kết");
        }

        @Test
        @DisplayName("Role không hợp lệ → AppException")
        void createUser_InvalidRole_ThrowsAppException() {
            UserCreateRequest request = UserCreateRequest.builder()
                    .username("newuser")
                    .password("password123")
                    .roles(Set.of("INVALID_ROLE"))
                    .build();

            when(userRepository.existsByUsername("newuser")).thenReturn(false);

            assertThatThrownBy(() -> userService.createUser(request))
                    .isInstanceOf(AppException.class)
                    .hasMessageContaining("không hợp lệ");
        }
    }

    @Nested
    @DisplayName("toggleUserStatus")
    class ToggleUserStatus {

        @Test
        @DisplayName("Khóa tài khoản thành công")
        void toggleUserStatus_Deactivate_Success() {
            User user = TestFixtures.adminUser();
            when(userRepository.findById(1L)).thenReturn(Optional.of(user));
            when(userRepository.save(any(User.class))).thenReturn(user);

            UserResponse response = userService.toggleUserStatus(1L, false);

            assertThat(user.getIsActive()).isFalse();
        }

        @Test
        @DisplayName("User không tồn tại → ResourceNotFoundException")
        void toggleUserStatus_UserNotFound() {
            when(userRepository.findById(999L)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> userService.toggleUserStatus(999L, true))
                    .isInstanceOf(ResourceNotFoundException.class);
        }
    }

    @Nested
    @DisplayName("resetPassword")
    class ResetPassword {

        @Test
        @DisplayName("Reset mật khẩu thành công")
        void resetPassword_Success() {
            User user = TestFixtures.adminUser();
            PasswordResetRequest request = new PasswordResetRequest("newPass123");

            when(userRepository.findById(1L)).thenReturn(Optional.of(user));
            when(passwordEncoder.encode("newPass123")).thenReturn("$2a$12$encodedNew");

            userService.resetPassword(1L, request);

            verify(userRepository).save(user);
            verify(passwordEncoder).encode("newPass123");
        }
    }

    @Nested
    @DisplayName("updateUserRoles")
    class UpdateUserRoles {

        @Test
        @DisplayName("Cập nhật roles thành công")
        void updateUserRoles_Success() {
            User user = TestFixtures.adminUser();
            UpdateRolesRequest request = new UpdateRolesRequest(Set.of("HR_ADMIN", "MANAGER"));

            when(userRepository.findById(1L)).thenReturn(Optional.of(user));
            when(roleRepository.findByName(RoleType.HR_ADMIN)).thenReturn(Optional.of(TestFixtures.hrAdminRole()));
            when(roleRepository.findByName(RoleType.MANAGER)).thenReturn(Optional.of(TestFixtures.managerRole()));
            when(userRepository.save(any(User.class))).thenReturn(user);

            UserResponse response = userService.updateUserRoles(1L, request);

            assertThat(user.getRoles()).hasSize(2);
        }

        @Test
        @DisplayName("Cập nhật với role không hợp lệ → AppException")
        void updateUserRoles_InvalidRole_ThrowsAppException() {
            User user = TestFixtures.adminUser();
            UpdateRolesRequest request = new UpdateRolesRequest(Set.of("INVALID"));

            when(userRepository.findById(1L)).thenReturn(Optional.of(user));

            assertThatThrownBy(() -> userService.updateUserRoles(1L, request))
                    .isInstanceOf(AppException.class);
        }
    }
}
