package com.hrmpro.module.leave.controller;

import com.hrmpro.common.dto.ApiResponse;
import com.hrmpro.common.dto.PageResponse;
import com.hrmpro.module.auth.entity.UserPrincipal;
import com.hrmpro.module.leave.dto.LeaveApprovalDto;
import com.hrmpro.module.leave.dto.LeaveBalanceResponse;
import com.hrmpro.module.leave.dto.LeaveRequestDto;
import com.hrmpro.module.leave.dto.LeaveRequestResponse;
import com.hrmpro.module.leave.service.LeaveService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/v1/leaves")
@RequiredArgsConstructor
public class LeaveController {

    private final LeaveService leaveService;

    @GetMapping("/balances")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<List<LeaveBalanceResponse>>> getLeaveBalances(
            @RequestParam(required = false) Long employeeId,
            @RequestParam(required = false) Integer year,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        int targetYear = year != null ? year : LocalDate.now().getYear();
        Long targetEmployeeId = employeeId;

        boolean isEmployee = principal.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_EMPLOYEE"));
        if (isEmployee || targetEmployeeId == null) {
            targetEmployeeId = principal.getEmployeeId();
        }

        if (targetEmployeeId == null) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Tài khoản này không liên kết với nhân viên"));
        }

        List<LeaveBalanceResponse> balances = leaveService.getLeaveBalances(targetEmployeeId, targetYear);
        return ResponseEntity.ok(ApiResponse.ok("Lấy số dư nghỉ phép thành công", balances));
    }

    @PostMapping(value = "/requests", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<LeaveRequestResponse>> createLeaveRequest(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestPart("request") @Valid LeaveRequestDto request,
            @RequestPart(value = "file", required = false) MultipartFile file
    ) {
        if (principal.getEmployeeId() == null) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Tài khoản này không liên kết với nhân viên"));
        }
        LeaveRequestResponse response = leaveService.createLeaveRequest(principal.getEmployeeId(), request, file);
        return ResponseEntity.ok(ApiResponse.ok("Gửi đơn xin nghỉ phép thành công", response));
    }

    @PutMapping("/requests/{id}/approve")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'HR_ADMIN', 'MANAGER')")
    public ResponseEntity<ApiResponse<LeaveRequestResponse>> approveLeaveRequest(
            @PathVariable Long id,
            @Valid @RequestBody LeaveApprovalDto approval,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        if (principal.getEmployeeId() == null) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Tài khoản này không liên kết với nhân viên"));
        }
        LeaveRequestResponse response = leaveService.approveLeaveRequest(id, approval, principal.getEmployeeId());
        String msg = "APPROVED".equalsIgnoreCase(approval.getStatus()) ? "Duyệt đơn nghỉ phép thành công" : "Từ chối đơn nghỉ phép thành công";
        return ResponseEntity.ok(ApiResponse.ok(msg, response));
    }

    @PutMapping("/requests/{id}/override")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'HR_ADMIN')")
    public ResponseEntity<ApiResponse<LeaveRequestResponse>> hrOverrideLeaveRequest(
            @PathVariable Long id,
            @Valid @RequestBody LeaveApprovalDto approval,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        if (principal.getEmployeeId() == null) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Tài khoản này không liên kết với nhân viên"));
        }
        LeaveRequestResponse response = leaveService.hrOverrideLeaveRequest(id, approval, principal.getEmployeeId());
        return ResponseEntity.ok(ApiResponse.ok("HR override trạng thái đơn nghỉ phép thành công", response));
    }

    @GetMapping("/requests")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<PageResponse<LeaveRequestResponse>>> getLeaveRequests(
            @RequestParam(required = false) Long employeeId,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(required = false) Long departmentId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "id") String sortBy,
            @RequestParam(defaultValue = "desc") String direction,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        Sort sort = direction.equalsIgnoreCase("asc") ? Sort.by(sortBy).ascending() : Sort.by(sortBy).descending();
        Pageable pageable = PageRequest.of(page, size, sort);

        Long filterEmployeeId = employeeId;
        Long filterManagerId = null;

        boolean isEmployee = principal.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_EMPLOYEE"));
        boolean isManager = principal.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_MANAGER"));

        if (isEmployee) {
            filterEmployeeId = principal.getEmployeeId();
        } else if (isManager) {
            if (filterEmployeeId == null) {
                filterManagerId = principal.getEmployeeId();
            } else {
                filterManagerId = principal.getEmployeeId();
            }
        }

        PageResponse<LeaveRequestResponse> response = leaveService.getLeaveRequests(
                filterEmployeeId, filterManagerId, status, startDate, endDate, departmentId, pageable
        );
        return ResponseEntity.ok(ApiResponse.ok("Lấy danh sách đơn xin nghỉ phép thành công", response));
    }
}
