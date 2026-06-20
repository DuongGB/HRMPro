package com.hrmpro.module.performance.controller;

import com.hrmpro.common.dto.ApiResponse;
import com.hrmpro.module.auth.entity.UserPrincipal;
import com.hrmpro.module.performance.dto.KpiRecordDto;
import com.hrmpro.module.performance.dto.PerformanceReviewDto;
import com.hrmpro.module.performance.dto.ReviewCycleDto;
import com.hrmpro.module.performance.entity.KpiRecord;
import com.hrmpro.module.performance.entity.PerformanceReview;
import com.hrmpro.module.performance.entity.ReviewCycle;
import com.hrmpro.module.performance.service.PerformanceService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/performance")
@RequiredArgsConstructor
public class PerformanceController {

    private final PerformanceService performanceService;

    // ─── REVIEW CYCLES API ────────────────────────────────────────────────────────

    @GetMapping("/cycles")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<List<ReviewCycleDto>>> getCycles() {
        List<ReviewCycleDto> list = performanceService.getAllCycles().stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
        return ResponseEntity.ok(ApiResponse.ok(list));
    }

    @GetMapping("/cycles/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<ReviewCycleDto>> getCycle(@PathVariable Long id) {
        ReviewCycleDto dto = convertToDto(performanceService.getCycle(id));
        return ResponseEntity.ok(ApiResponse.ok(dto));
    }

    @PostMapping("/cycles")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'HR_ADMIN')")
    public ResponseEntity<ApiResponse<ReviewCycleDto>> createCycle(@Valid @RequestBody ReviewCycleDto dto) {
        ReviewCycle cycle = convertToEntity(dto);
        ReviewCycle created = performanceService.createCycle(cycle);
        return ResponseEntity.ok(ApiResponse.ok(convertToDto(created)));
    }

    @PutMapping("/cycles/{id}/status")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'HR_ADMIN')")
    public ResponseEntity<ApiResponse<ReviewCycleDto>> updateCycleStatus(@PathVariable Long id, @RequestParam String status) {
        ReviewCycle updated = performanceService.updateCycleStatus(id, status);
        return ResponseEntity.ok(ApiResponse.ok(convertToDto(updated)));
    }

    // ─── PERFORMANCE REVIEWS API ──────────────────────────────────────────────────

    @GetMapping("/reviews/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<PerformanceReviewDto>> getReview(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal principal) {
        PerformanceReview review = performanceService.getReview(id);
        
        // Kiểm tra bảo mật dòng: Chỉ HR/Admin hoặc chính Employee/Reviewer được xem phiếu này
        boolean isHROrAdmin = principal.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_SUPER_ADMIN") || a.getAuthority().equals("ROLE_HR_ADMIN") || a.getAuthority().equals("ROLE_HR_STAFF"));
        
        if (!isHROrAdmin 
                && !review.getEmployee().getId().equals(principal.getEmployeeId()) 
                && !review.getReviewer().getId().equals(principal.getEmployeeId())) {
            return ResponseEntity.status(403).body(ApiResponse.error("Bạn không có quyền xem phiếu đánh giá này."));
        }

        PerformanceReviewDto dto = convertToDto(review);
        return ResponseEntity.ok(ApiResponse.ok(dto));
    }

    @GetMapping("/reviews/my")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<List<PerformanceReviewDto>>> getMyReviews(@AuthenticationPrincipal UserPrincipal principal) {
        if (principal.getEmployeeId() == null) {
            return ResponseEntity.ok(ApiResponse.ok(List.of()));
        }
        List<PerformanceReviewDto> list = performanceService.getReviewsByEmployee(principal.getEmployeeId()).stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
        return ResponseEntity.ok(ApiResponse.ok(list));
    }

    @GetMapping("/reviews/reviewer")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'HR_ADMIN', 'MANAGER')")
    public ResponseEntity<ApiResponse<List<PerformanceReviewDto>>> getReviewsToEvaluate(@AuthenticationPrincipal UserPrincipal principal) {
        if (principal.getEmployeeId() == null) {
            return ResponseEntity.ok(ApiResponse.ok(List.of()));
        }
        List<PerformanceReviewDto> list = performanceService.getReviewsByReviewer(principal.getEmployeeId()).stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
        return ResponseEntity.ok(ApiResponse.ok(list));
    }

    @GetMapping("/reviews/cycle/{cycleId}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'HR_ADMIN', 'HR_STAFF')")
    public ResponseEntity<ApiResponse<List<PerformanceReviewDto>>> getReviewsByCycle(@PathVariable Long cycleId) {
        List<PerformanceReviewDto> list = performanceService.getReviewsByCycle(cycleId).stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
        return ResponseEntity.ok(ApiResponse.ok(list));
    }

    @PostMapping("/reviews/{id}/self")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<PerformanceReviewDto>> selfEvaluate(
            @PathVariable Long id,
            @RequestBody PerformanceReviewDto evalDto,
            @AuthenticationPrincipal UserPrincipal principal) {
        
        PerformanceReview review = performanceService.getReview(id);
        if (!review.getEmployee().getId().equals(principal.getEmployeeId())) {
            return ResponseEntity.status(403).body(ApiResponse.error("Bạn chỉ có thể tự điền phiếu đánh giá của chính mình."));
        }

        PerformanceReview updated = performanceService.selfEvaluate(
                id, evalDto.getSelfScore(), evalDto.getStrengths(), evalDto.getImprovements(), evalDto.getGoalsNext()
        );
        return ResponseEntity.ok(ApiResponse.ok(convertToDto(updated)));
    }

    @PostMapping("/reviews/{id}/evaluate")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'HR_ADMIN', 'MANAGER')")
    public ResponseEntity<ApiResponse<PerformanceReviewDto>> managerEvaluate(
            @PathVariable Long id,
            @RequestBody PerformanceReviewDto evalDto,
            @AuthenticationPrincipal UserPrincipal principal) {
        
        PerformanceReview review = performanceService.getReview(id);
        boolean isHR = principal.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_SUPER_ADMIN") || a.getAuthority().equals("ROLE_HR_ADMIN"));
        
        if (!isHR && !review.getReviewer().getId().equals(principal.getEmployeeId())) {
            return ResponseEntity.status(403).body(ApiResponse.error("Bạn không phải người được phân công đánh giá nhân sự này."));
        }

        PerformanceReview updated = performanceService.managerEvaluate(id, evalDto.getReviewerScore(), evalDto.getKpis());
        return ResponseEntity.ok(ApiResponse.ok(convertToDto(updated)));
    }

    // ─── CONVERTERS ───────────────────────────────────────────────────────────────

    private ReviewCycleDto convertToDto(ReviewCycle entity) {
        return ReviewCycleDto.builder()
                .id(entity.getId())
                .name(entity.getName())
                .cycleType(entity.getCycleType())
                .startDate(entity.getStartDate())
                .endDate(entity.getEndDate())
                .status(entity.getStatus())
                .build();
    }

    private ReviewCycle convertToEntity(ReviewCycleDto dto) {
        return ReviewCycle.builder()
                .id(dto.getId())
                .name(dto.getName())
                .cycleType(dto.getCycleType())
                .startDate(dto.getStartDate())
                .endDate(dto.getEndDate())
                .status(dto.getStatus())
                .build();
    }

    private PerformanceReviewDto convertToDto(PerformanceReview entity) {
        List<KpiRecordDto> kpiDtos = performanceService.getKpisByReview(entity.getId()).stream()
                .map(k -> KpiRecordDto.builder()
                        .id(k.getId())
                        .kpiName(k.getKpiName())
                        .weight(k.getWeight())
                        .target(k.getTarget())
                        .actual(k.getActual())
                        .score(k.getScore())
                        .build())
                .collect(Collectors.toList());

        return PerformanceReviewDto.builder()
                .id(entity.getId())
                .cycleId(entity.getCycle().getId())
                .cycleName(entity.getCycle().getName())
                .employeeId(entity.getEmployee().getId())
                .employeeCode(entity.getEmployee().getEmployeeCode())
                .employeeName(entity.getEmployee().getFullName())
                .departmentName(entity.getEmployee().getDepartment() != null ? entity.getEmployee().getDepartment().getName() : "—")
                .reviewerId(entity.getReviewer().getId())
                .reviewerName(entity.getReviewer().getFullName())
                .selfScore(entity.getSelfScore())
                .reviewerScore(entity.getReviewerScore())
                .finalScore(entity.getFinalScore())
                .rating(entity.getRating())
                .strengths(entity.getStrengths())
                .improvements(entity.getImprovements())
                .goalsNext(entity.getGoalsNext())
                .status(entity.getStatus())
                .completedAt(entity.getCompletedAt())
                .kpis(kpiDtos)
                .build();
    }
}
