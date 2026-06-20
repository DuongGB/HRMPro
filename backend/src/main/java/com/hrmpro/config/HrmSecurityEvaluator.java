package com.hrmpro.config;

import com.hrmpro.module.auth.entity.UserPrincipal;
import com.hrmpro.module.employee.entity.Employee;
import com.hrmpro.module.employee.repository.EmployeeRepository;
import com.hrmpro.module.organization.entity.Department;
import com.hrmpro.module.organization.repository.DepartmentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

import java.util.Optional;

@Component("hrmSecurity")
@RequiredArgsConstructor
@Slf4j
public class HrmSecurityEvaluator {

    private final EmployeeRepository employeeRepository;
    private final DepartmentRepository departmentRepository;

    /**
     * Lấy thông tin UserPrincipal hiện tại từ SecurityContext
     */
    private Optional<UserPrincipal> getCurrentUserPrincipal() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            return Optional.empty();
        }
        Object principal = authentication.getPrincipal();
        if (principal instanceof UserPrincipal) {
            return Optional.of((UserPrincipal) principal);
        }
        return Optional.empty();
    }

    /**
     * Kiểm tra xem ID nhân viên được yêu cầu có trùng với chính mình không
     */
    public boolean isSelf(Long employeeId) {
        if (employeeId == null) return false;
        return getCurrentUserPrincipal()
                .map(principal -> employeeId.equals(principal.getEmployeeId()))
                .orElse(false);
    }

    /**
     * Kiểm tra xem người dùng hiện tại có phải là Quản lý trực tiếp (Manager) của nhân viên này không
     */
    public boolean isManagerOf(Long employeeId) {
        if (employeeId == null) return false;
        
        Optional<UserPrincipal> currentUserOpt = getCurrentUserPrincipal();
        if (currentUserOpt.isEmpty()) return false;
        
        Long currentEmployeeId = currentUserOpt.get().getEmployeeId();
        if (currentEmployeeId == null) return false;

        // Tìm nhân viên cần kiểm tra
        Optional<Employee> targetEmployeeOpt = employeeRepository.findById(employeeId);
        if (targetEmployeeOpt.isEmpty()) return false;

        Employee targetEmployee = targetEmployeeOpt.get();
        // So sánh manager_id của nhân viên mục tiêu với employee_id của user hiện tại
        return targetEmployee.getManager() != null && currentEmployeeId.equals(targetEmployee.getManager().getId());
    }

    /**
     * Kiểm tra xem người dùng hiện tại có phải là Trưởng phòng (Manager) của phòng ban này không
     */
    public boolean isManagerOfDepartment(Long departmentId) {
        if (departmentId == null) return false;

        Optional<UserPrincipal> currentUserOpt = getCurrentUserPrincipal();
        if (currentUserOpt.isEmpty()) return false;

        Long currentEmployeeId = currentUserOpt.get().getEmployeeId();
        if (currentEmployeeId == null) return false;

        // Tìm phòng ban
        Optional<Department> departmentOpt = departmentRepository.findById(departmentId);
        if (departmentOpt.isEmpty()) return false;

        Department department = departmentOpt.get();
        // So sánh manager_id của phòng ban với employee_id của user hiện tại
        return department.getManagerId() != null && currentEmployeeId.equals(department.getManagerId());
    }
}
