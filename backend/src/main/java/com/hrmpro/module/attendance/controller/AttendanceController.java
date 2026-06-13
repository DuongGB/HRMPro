package com.hrmpro.module.attendance.controller;

import com.hrmpro.common.dto.ApiResponse;
import com.hrmpro.common.dto.PageResponse;
import com.hrmpro.module.attendance.dto.AttendanceAdjustmentRequest;
import com.hrmpro.module.attendance.dto.AttendanceLogResponse;
import com.hrmpro.module.attendance.dto.CheckInRequest;
import com.hrmpro.module.attendance.service.AttendanceService;
import com.hrmpro.module.auth.entity.UserPrincipal;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDate;

@RestController
@RequestMapping("/api/v1/attendance")
@RequiredArgsConstructor
public class AttendanceController {

    private final AttendanceService attendanceService;

    /**
     * Chấm công (giống máy chấm công thực tế: 1 nút duy nhất)
     * - Lần đầu tiên trong ngày → ghi nhận check-in
     * - Các lần tiếp theo → cập nhật check-out (lần cuối cùng là giờ ra)
     */
    @PostMapping("/check")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<AttendanceLogResponse>> check(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestBody CheckInRequest request
    ) {
        if (principal.getEmployeeId() == null) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Tài khoản này không liên kết với nhân viên"));
        }
        AttendanceLogResponse response = attendanceService.check(principal.getEmployeeId(), request);
        return ResponseEntity.ok(ApiResponse.ok("Chấm công thành công", response));
    }

    @PostMapping("/adjust")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<AttendanceLogResponse>> requestAdjustment(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody AttendanceAdjustmentRequest request
    ) {
        if (principal.getEmployeeId() == null) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Tài khoản này không liên kết với nhân viên"));
        }
        AttendanceLogResponse response = attendanceService.requestAdjustment(principal.getEmployeeId(), request);
        return ResponseEntity.ok(ApiResponse.ok("Gửi yêu cầu điều chỉnh giờ công thành công", response));
    }

    @PutMapping("/logs/{id}/approve")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'HR_ADMIN', 'MANAGER')")
    public ResponseEntity<ApiResponse<AttendanceLogResponse>> approveAdjustment(
            @PathVariable Long id,
            @RequestParam Boolean approve,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        if (principal.getEmployeeId() == null) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Tài khoản này không liên kết với nhân viên"));
        }
        AttendanceLogResponse response = attendanceService.approveAdjustment(id, approve, principal.getEmployeeId());
        String msg = approve ? "Phê duyệt điều chỉnh công thành công" : "Từ chối điều chỉnh công thành công";
        return ResponseEntity.ok(ApiResponse.ok(msg, response));
    }

    @GetMapping("/logs")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'HR_ADMIN', 'HR_STAFF', 'MANAGER', 'EMPLOYEE')")
    public ResponseEntity<ApiResponse<PageResponse<AttendanceLogResponse>>> getAttendanceLogs(
            @RequestParam(required = false) Long employeeId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) Long departmentId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "workDate") String sortBy,
            @RequestParam(defaultValue = "desc") String direction,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        Sort sort = direction.equalsIgnoreCase("asc") ? Sort.by(sortBy).ascending() : Sort.by(sortBy).descending();
        Pageable pageable = PageRequest.of(page, size, sort);

        Long filterEmployeeId = employeeId;
        Long filterManagerId = null;

        // Xử lý bảo mật view theo Role
        boolean isEmployee = principal.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_EMPLOYEE"));
        boolean isManager = principal.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_MANAGER"));

        if (isEmployee) {
            // Employee chỉ được phép xem công của chính mình
            filterEmployeeId = principal.getEmployeeId();
        } else if (isManager) {
            // Manager chỉ xem được công của nhân viên trực thuộc team của họ (hoặc chính mình)
            if (filterEmployeeId == null) {
                filterManagerId = principal.getEmployeeId();
            } else {
                // Nếu lọc theo 1 employee cụ thể, Spring Security evaluator sẽ check xem có thuộc team không, hoặc ta gán managerId để bảo vệ
                filterManagerId = principal.getEmployeeId();
            }
        }

        PageResponse<AttendanceLogResponse> response = attendanceService.getAttendanceLogs(
                filterEmployeeId, startDate, endDate, status, filterManagerId, departmentId, pageable
        );
        return ResponseEntity.ok(ApiResponse.ok("Lấy danh sách nhật ký chấm công thành công", response));
    }

    @PostMapping("/import")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'HR_ADMIN')")
    public ResponseEntity<ApiResponse<Void>> importAttendance(@RequestParam("file") MultipartFile file) {
        attendanceService.importAttendanceExcel(file);
        return ResponseEntity.ok(ApiResponse.ok("Import dữ liệu chấm công từ file Excel thành công", null));
    }
}
