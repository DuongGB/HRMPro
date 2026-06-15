package com.hrmpro.module.dashboard.controller;

import com.hrmpro.common.dto.ApiResponse;
import com.hrmpro.module.auth.entity.UserPrincipal;
import com.hrmpro.module.dashboard.dto.DashboardReportDto;
import com.hrmpro.module.dashboard.dto.EmployeeDashboardDto;
import com.hrmpro.module.dashboard.service.ReportService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/dashboard")
@RequiredArgsConstructor
public class ReportController {

    private final ReportService reportService;

    @GetMapping("/reports")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<DashboardReportDto>> getDashboardReport(
            @AuthenticationPrincipal UserPrincipal principal) {
        List<String> roles = principal.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .collect(Collectors.toList());
        
        DashboardReportDto report = reportService.getDashboardReport(principal.getEmployeeId(), roles);
        return ResponseEntity.ok(ApiResponse.ok(report));
    }

    @GetMapping("/employee")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<EmployeeDashboardDto>> getEmployeeDashboard(
            @AuthenticationPrincipal UserPrincipal principal) {
        if (principal.getEmployeeId() == null) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Tài khoản này không liên kết với nhân viên"));
        }

        EmployeeDashboardDto dashboard = reportService.getEmployeeDashboard(principal.getEmployeeId());
        return ResponseEntity.ok(ApiResponse.ok("Lấy dashboard nhân viên thành công", dashboard));
    }
}
