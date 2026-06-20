package com.hrmpro.integration;

import com.hrmpro.module.auth.dto.LoginRequest;
import com.hrmpro.module.auth.dto.LoginResponse;
import com.hrmpro.module.auth.entity.Role;
import com.hrmpro.module.auth.entity.User;
import com.hrmpro.module.auth.enums.RoleType;
import com.hrmpro.module.auth.repository.RoleRepository;
import com.hrmpro.module.auth.repository.UserRepository;
import com.hrmpro.module.employee.dto.EmployeeCreateRequest;
import com.hrmpro.module.employee.dto.EmployeeResponse;
import com.hrmpro.module.employee.dto.EmployeeUpdateRequest;
import com.hrmpro.module.employee.entity.Employee;
import com.hrmpro.module.employee.repository.EmployeeRepository;
import com.hrmpro.common.dto.ApiResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.*;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalDate;
import java.util.HashSet;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;

@DisplayName("Employee Integration Tests (Testcontainers)")
class EmployeeIntegrationTest extends AbstractIntegrationTest {

    @Autowired
    private TestRestTemplate restTemplate;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private EmployeeRepository employeeRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    private String adminToken;

    @BeforeEach
    void setUp() {
        userRepository.deleteAll();
        employeeRepository.deleteAll();
        roleRepository.deleteAll();

        // Khởi tạo HR Admin role & user
        Role hrRole = Role.builder().name(RoleType.HR_ADMIN).build();
        roleRepository.save(hrRole);

        Set<Role> roles = new HashSet<>();
        roles.add(hrRole);

        User adminUser = User.builder()
                .username("hr_admin_integration")
                .password(passwordEncoder.encode("password123"))
                .roles(roles)
                .isActive(true)
                .build();
        userRepository.save(adminUser);

        // Đăng nhập lấy token
        LoginRequest loginRequest = new LoginRequest("hr_admin_integration", "password123");
        ResponseEntity<ApiResponse<LoginResponse>> loginResponse = restTemplate.exchange(
                "/api/v1/auth/login",
                HttpMethod.POST,
                new HttpEntity<>(loginRequest),
                new ParameterizedTypeReference<ApiResponse<LoginResponse>>() {}
        );
        adminToken = loginResponse.getBody().data().accessToken();
    }

    @Test
    @DisplayName("End-to-End Employee Lifecycle: Tạo -> Lấy -> Sửa -> Thôi việc")
    void employeeLifecycle_Success() {
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(adminToken);

        // 1. Tạo nhân viên mới (POST)
        EmployeeCreateRequest createRequest = EmployeeCreateRequest.builder()
                .employeeCode("EMP999")
                .firstName("Integrate")
                .lastName("Tester")
                .email("integrate.tester@hrmpro.com")
                .hireDate(LocalDate.now())
                .build();

        ResponseEntity<ApiResponse<EmployeeResponse>> createResponse = restTemplate.exchange(
                "/api/v1/employees",
                HttpMethod.POST,
                new HttpEntity<>(createRequest, headers),
                new ParameterizedTypeReference<ApiResponse<EmployeeResponse>>() {}
        );

        assertThat(createResponse.getStatusCode()).isEqualTo(HttpStatus.OK);
        EmployeeResponse employee = createResponse.getBody().data();
        assertThat(employee.getId()).isNotNull();
        assertThat(employee.getEmployeeCode()).isEqualTo("EMP999");
        assertThat(employee.getStatus()).isEqualTo("PROBATION");

        Long employeeId = employee.getId();

        // 2. Lấy thông tin chi tiết nhân viên (GET)
        ResponseEntity<ApiResponse<EmployeeResponse>> getResponse = restTemplate.exchange(
                "/api/v1/employees/" + employeeId,
                HttpMethod.GET,
                new HttpEntity<>(headers),
                new ParameterizedTypeReference<ApiResponse<EmployeeResponse>>() {}
        );

        assertThat(getResponse.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(getResponse.getBody().data().getEmployeeCode()).isEqualTo("EMP999");

        // 3. Sửa thông tin nhân viên (PUT)
        EmployeeUpdateRequest updateRequest = EmployeeUpdateRequest.builder()
                .firstName("Integrate")
                .lastName("Tester Edited")
                .email("integrate.tester@hrmpro.com")
                .build();

        ResponseEntity<ApiResponse<EmployeeResponse>> updateResponse = restTemplate.exchange(
                "/api/v1/employees/" + employeeId,
                HttpMethod.PUT,
                new HttpEntity<>(updateRequest, headers),
                new ParameterizedTypeReference<ApiResponse<EmployeeResponse>>() {}
        );

        assertThat(updateResponse.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(updateResponse.getBody().data().getLastName()).isEqualTo("Tester Edited");

        // 4. Thôi việc nhân viên (POST /terminate)
        ResponseEntity<ApiResponse<EmployeeResponse>> terminateResponse = restTemplate.exchange(
                "/api/v1/employees/" + employeeId + "/terminate?terminationDate=" + LocalDate.now(),
                HttpMethod.POST,
                new HttpEntity<>(headers),
                new ParameterizedTypeReference<ApiResponse<EmployeeResponse>>() {}
        );

        assertThat(terminateResponse.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(terminateResponse.getBody().data().getStatus()).isEqualTo("TERMINATED");
        assertThat(terminateResponse.getBody().data().getTerminationDate()).isEqualTo(LocalDate.now());
    }
}
