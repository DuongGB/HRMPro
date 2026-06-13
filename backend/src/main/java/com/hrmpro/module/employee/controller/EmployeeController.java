package com.hrmpro.module.employee.controller;

import com.hrmpro.common.dto.ApiResponse;
import com.hrmpro.common.dto.PageResponse;
import com.hrmpro.module.employee.dto.EmployeeCreateRequest;
import com.hrmpro.module.employee.dto.EmployeeResponse;
import com.hrmpro.module.employee.dto.EmployeeUpdateRequest;
import com.hrmpro.module.employee.dto.SelfUpdateRequest;
import com.hrmpro.module.employee.service.EmployeeService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDate;

@RestController
@RequestMapping("/api/v1/employees")
@RequiredArgsConstructor
public class EmployeeController {

    private final EmployeeService employeeService;

    @GetMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'HR_ADMIN', 'HR_STAFF', 'MANAGER', 'RECRUITER')")
    public ResponseEntity<ApiResponse<PageResponse<EmployeeResponse>>> getEmployees(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) Long departmentId,
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "id") String sortBy,
            @RequestParam(defaultValue = "asc") String direction
    ) {
        Sort sort = direction.equalsIgnoreCase("desc") ? Sort.by(sortBy).descending() : Sort.by(sortBy).ascending();
        Pageable pageable = PageRequest.of(page, size, sort);
        PageResponse<EmployeeResponse> response = employeeService.getEmployees(search, departmentId, status, pageable);
        return ResponseEntity.ok(ApiResponse.ok("Lấy danh sách nhân viên thành công", response));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'HR_ADMIN', 'HR_STAFF') or (hasRole('MANAGER') and @hrmSecurity.isManagerOf(#id)) or @hrmSecurity.isSelf(#id)")
    public ResponseEntity<ApiResponse<EmployeeResponse>> getEmployee(@PathVariable Long id) {
        EmployeeResponse response = employeeService.getEmployee(id);
        return ResponseEntity.ok(ApiResponse.ok("Lấy thông tin nhân viên thành công", response));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'HR_ADMIN')")
    public ResponseEntity<ApiResponse<EmployeeResponse>> createEmployee(@Valid @RequestBody EmployeeCreateRequest request) {
        EmployeeResponse response = employeeService.createEmployee(request);
        return ResponseEntity.ok(ApiResponse.ok("Tạo hồ sơ nhân viên thành công", response));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'HR_ADMIN', 'HR_STAFF')")
    public ResponseEntity<ApiResponse<EmployeeResponse>> updateEmployee(
            @PathVariable Long id,
            @Valid @RequestBody EmployeeUpdateRequest request
    ) {
        EmployeeResponse response = employeeService.updateEmployee(id, request);
        return ResponseEntity.ok(ApiResponse.ok("Cập nhật hồ sơ nhân viên thành công", response));
    }

    @PatchMapping("/{id}/self")
    @PreAuthorize("@hrmSecurity.isSelf(#id)")
    public ResponseEntity<ApiResponse<EmployeeResponse>> selfUpdateEmployee(
            @PathVariable Long id,
            @Valid @RequestBody SelfUpdateRequest request
    ) {
        EmployeeResponse response = employeeService.selfUpdateEmployee(id, request);
        return ResponseEntity.ok(ApiResponse.ok("Cập nhật thông tin cá nhân thành công", response));
    }

    @PostMapping(value = "/{id}/avatar", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'HR_ADMIN') or @hrmSecurity.isSelf(#id)")
    public ResponseEntity<ApiResponse<EmployeeResponse>> updateAvatar(
            @PathVariable Long id,
            @RequestParam("file") MultipartFile file
    ) {
        EmployeeResponse response = employeeService.updateAvatar(id, file);
        return ResponseEntity.ok(ApiResponse.ok("Cập nhật ảnh đại diện thành công", response));
    }

    @PostMapping("/{id}/terminate")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'HR_ADMIN')")
    public ResponseEntity<ApiResponse<EmployeeResponse>> terminateEmployee(
            @PathVariable Long id,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate terminationDate
    ) {
        EmployeeResponse response = employeeService.terminateEmployee(id, terminationDate);
        return ResponseEntity.ok(ApiResponse.ok("Cập nhật trạng thái thôi việc thành công", response));
    }
}
