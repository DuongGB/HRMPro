package com.hrmpro.util;

import com.hrmpro.module.auth.entity.Role;
import com.hrmpro.module.auth.entity.User;
import com.hrmpro.module.auth.entity.UserPrincipal;
import com.hrmpro.module.auth.enums.RoleType;
import com.hrmpro.module.employee.entity.Employee;
import com.hrmpro.module.organization.entity.Department;
import com.hrmpro.module.organization.entity.Position;
import org.springframework.security.core.authority.SimpleGrantedAuthority;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Factory methods tạo test data dùng chung cho toàn bộ test suite.
 * Giúp tránh code trùng lặp (DRY) và giữ consistency.
 */
public final class TestFixtures {

    private TestFixtures() {
        // Utility class
    }

    // ─── Role Fixtures ─────────────────────────────────────────────

    public static Role createRole(Long id, RoleType type) {
        return Role.builder().id(id).name(type).build();
    }

    public static Role superAdminRole() {
        return createRole(1L, RoleType.SUPER_ADMIN);
    }

    public static Role hrAdminRole() {
        return createRole(2L, RoleType.HR_ADMIN);
    }

    public static Role hrStaffRole() {
        return createRole(3L, RoleType.HR_STAFF);
    }

    public static Role managerRole() {
        return createRole(4L, RoleType.MANAGER);
    }

    public static Role employeeRole() {
        return createRole(5L, RoleType.EMPLOYEE);
    }

    public static Role recruiterRole() {
        return createRole(6L, RoleType.RECRUITER);
    }

    // ─── Department & Position Fixtures ─────────────────────────────

    public static Department createDepartment(Long id, String name) {
        return Department.builder()
                .id(id)
                .name(name)
                .build();
    }

    public static Department itDepartment() {
        return createDepartment(1L, "Phòng Công nghệ");
    }

    public static Department hrDepartment() {
        return createDepartment(2L, "Phòng Nhân sự");
    }

    public static Position createPosition(Long id, String name) {
        return Position.builder()
                .id(id)
                .name(name)
                .build();
    }

    public static Position seniorDevPosition() {
        return createPosition(1L, "Senior Developer");
    }

    // ─── Employee Fixtures ──────────────────────────────────────────

    public static Employee createEmployee(Long id, String code, String firstName, String lastName) {
        return Employee.builder()
                .id(id)
                .employeeCode(code)
                .firstName(firstName)
                .lastName(lastName)
                .email(code.toLowerCase() + "@hrmpro.vn")
                .phone("0901234567")
                .gender("MALE")
                .hireDate(LocalDate.of(2024, 1, 1))
                .status("ACTIVE")
                .department(itDepartment())
                .position(seniorDevPosition())
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();
    }

    public static Employee defaultEmployee() {
        return createEmployee(1L, "NV001", "Anh", "Nguyễn Văn");
    }

    public static Employee anotherEmployee() {
        return createEmployee(2L, "NV002", "Bình", "Trần Văn");
    }

    public static Employee managerEmployee() {
        Employee manager = createEmployee(3L, "NV003", "Cường", "Lê Đức");
        manager.setDepartment(itDepartment());
        return manager;
    }

    // ─── User Fixtures ──────────────────────────────────────────────

    public static User createUser(Long id, String username, String password, Set<Role> roles, Employee employee) {
        return User.builder()
                .id(id)
                .username(username)
                .password(password)
                .roles(roles)
                .employee(employee)
                .isActive(true)
                .createdAt(LocalDateTime.now())
                .build();
    }

    public static User adminUser() {
        Set<Role> roles = new HashSet<>();
        roles.add(superAdminRole());
        return createUser(1L, "admin", "$2a$12$encodedPassword", roles, null);
    }

    public static User hrUser() {
        Set<Role> roles = new HashSet<>();
        roles.add(hrAdminRole());
        Employee emp = createEmployee(10L, "HR001", "HR", "Admin");
        return createUser(2L, "hr_admin", "$2a$12$encodedPassword", roles, emp);
    }

    public static User employeeUser() {
        Set<Role> roles = new HashSet<>();
        roles.add(employeeRole());
        Employee emp = defaultEmployee();
        return createUser(3L, "employee1", "$2a$12$encodedPassword", roles, emp);
    }

    public static User managerUser() {
        Set<Role> roles = new HashSet<>();
        roles.add(managerRole());
        Employee emp = managerEmployee();
        return createUser(4L, "manager1", "$2a$12$encodedPassword", roles, emp);
    }

    // ─── UserPrincipal Fixtures ─────────────────────────────────────

    public static UserPrincipal createUserPrincipal(User user) {
        return UserPrincipal.builder()
                .id(user.getId())
                .username(user.getUsername())
                .password(user.getPassword())
                .employeeId(user.getEmployee() != null ? user.getEmployee().getId() : null)
                .isActive(user.getIsActive())
                .authorities(user.getRoles().stream()
                        .map(role -> new SimpleGrantedAuthority("ROLE_" + role.getName().name()))
                        .collect(Collectors.toList()))
                .build();
    }

    public static UserPrincipal adminPrincipal() {
        return createUserPrincipal(adminUser());
    }

    public static UserPrincipal employeePrincipal() {
        return createUserPrincipal(employeeUser());
    }

    public static UserPrincipal managerPrincipal() {
        return createUserPrincipal(managerUser());
    }

    public static UserPrincipal hrPrincipal() {
        return createUserPrincipal(hrUser());
    }
}
