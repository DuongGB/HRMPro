package com.hrmpro.module.organization.controller;

import com.hrmpro.common.dto.ApiResponse;
import com.hrmpro.module.organization.dto.DepartmentRequest;
import com.hrmpro.module.organization.dto.DepartmentResponse;
import com.hrmpro.module.organization.service.DepartmentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/departments")
@RequiredArgsConstructor
public class DepartmentController {

    private final DepartmentService departmentService;

    @GetMapping("/tree")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<List<DepartmentResponse>>> getDepartmentTree() {
        List<DepartmentResponse> tree = departmentService.getDepartmentTree();
        return ResponseEntity.ok(ApiResponse.ok("Lấy sơ đồ tổ chức phòng ban thành công", tree));
    }

    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<List<DepartmentResponse>>> getAllDepartments() {
        List<DepartmentResponse> list = departmentService.getAllDepartments();
        return ResponseEntity.ok(ApiResponse.ok("Lấy danh sách phòng ban thành công", list));
    }

    @GetMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<DepartmentResponse>> getDepartment(@PathVariable Long id) {
        DepartmentResponse department = departmentService.getDepartment(id);
        return ResponseEntity.ok(ApiResponse.ok("Lấy chi tiết phòng ban thành công", department));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'HR_ADMIN')")
    public ResponseEntity<ApiResponse<DepartmentResponse>> createDepartment(@Valid @RequestBody DepartmentRequest request) {
        DepartmentResponse response = departmentService.createDepartment(request);
        return ResponseEntity.ok(ApiResponse.ok("Tạo phòng ban thành công", response));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'HR_ADMIN')")
    public ResponseEntity<ApiResponse<DepartmentResponse>> updateDepartment(
            @PathVariable Long id,
            @Valid @RequestBody DepartmentRequest request
    ) {
        DepartmentResponse response = departmentService.updateDepartment(id, request);
        return ResponseEntity.ok(ApiResponse.ok("Cập nhật phòng ban thành công", response));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'HR_ADMIN')")
    public ResponseEntity<ApiResponse<Void>> deleteDepartment(@PathVariable Long id) {
        departmentService.deleteDepartment(id);
        return ResponseEntity.ok(ApiResponse.ok("Ngừng hoạt động phòng ban thành công", null));
    }

    @PostMapping("/{id}/activate")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'HR_ADMIN')")
    public ResponseEntity<ApiResponse<DepartmentResponse>> activateDepartment(@PathVariable Long id) {
        DepartmentResponse response = departmentService.activateDepartment(id);
        return ResponseEntity.ok(ApiResponse.ok("Kích hoạt lại phòng ban thành công", response));
    }
}
