package com.hrmpro.module.performance.service;

import com.hrmpro.module.employee.entity.Employee;
import com.hrmpro.module.employee.repository.EmployeeRepository;
import com.hrmpro.module.performance.dto.KpiRecordDto;
import com.hrmpro.module.performance.entity.KpiRecord;
import com.hrmpro.module.performance.entity.PerformanceReview;
import com.hrmpro.module.performance.entity.ReviewCycle;
import com.hrmpro.module.performance.repository.KpiRecordRepository;
import com.hrmpro.module.performance.repository.PerformanceReviewRepository;
import com.hrmpro.module.performance.repository.ReviewCycleRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("PerformanceService Unit Tests")
class PerformanceServiceTest {

    @Mock private ReviewCycleRepository reviewCycleRepository;
    @Mock private PerformanceReviewRepository performanceReviewRepository;
    @Mock private KpiRecordRepository kpiRecordRepository;
    @Mock private EmployeeRepository employeeRepository;

    @InjectMocks
    private PerformanceService performanceService;

    @Test
    @DisplayName("getCycle — tìm thấy → trả về")
    void getCycle_Found() {
        ReviewCycle cycle = ReviewCycle.builder().id(1L).name("Kỳ 1").build();
        when(reviewCycleRepository.findById(1L)).thenReturn(Optional.of(cycle));

        ReviewCycle result = performanceService.getCycle(1L);

        assertThat(result).isNotNull();
        assertThat(result.getName()).isEqualTo("Kỳ 1");
    }

    @Test
    @DisplayName("getCycle — không tìm thấy → ném ngoại lệ")
    void getCycle_NotFound_ThrowsException() {
        when(reviewCycleRepository.findById(1L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> performanceService.getCycle(1L))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("Không tìm thấy kỳ đánh giá ID: 1");
    }

    @Test
    @DisplayName("updateCycleStatus — chuyển thành ACTIVE → sinh các phiếu đánh giá cho nhân viên")
    void updateCycleStatus_ToActive_GeneratesReviews() {
        ReviewCycle cycle = ReviewCycle.builder().id(1L).name("Q1/2026").status("DRAFT").build();
        Employee emp1 = Employee.builder().id(10L).firstName("Emp").lastName("One").status("ACTIVE").build();
        Employee emp2 = Employee.builder().id(11L).firstName("Emp").lastName("Two").status("PROBATION").build();

        when(reviewCycleRepository.findById(1L)).thenReturn(Optional.of(cycle));
        when(employeeRepository.findAll()).thenReturn(List.of(emp1, emp2));
        when(performanceReviewRepository.findByCycleIdAndEmployeeId(eq(1L), anyLong())).thenReturn(Optional.empty());
        when(reviewCycleRepository.save(any(ReviewCycle.class))).thenAnswer(i -> i.getArgument(0));

        ReviewCycle updated = performanceService.updateCycleStatus(1L, "ACTIVE");

        assertThat(updated.getStatus()).isEqualTo("ACTIVE");
        verify(performanceReviewRepository, times(2)).save(any(PerformanceReview.class));
    }

    @Test
    @DisplayName("selfEvaluate — nhân viên tự điền phiếu → đổi sang MANAGER_EVALUATING")
    void selfEvaluate_Success() {
        PerformanceReview review = PerformanceReview.builder()
                .id(100L)
                .status("PENDING")
                .build();

        when(performanceReviewRepository.findById(100L)).thenReturn(Optional.of(review));
        when(performanceReviewRepository.save(any(PerformanceReview.class))).thenAnswer(i -> i.getArgument(0));

        PerformanceReview result = performanceService.selfEvaluate(
                100L, BigDecimal.valueOf(4.0), "Tốt", "Cần cải thiện", "Đạt KPI"
        );

        assertThat(result.getStatus()).isEqualTo("MANAGER_EVALUATING");
        assertThat(result.getSelfScore()).isEqualTo(BigDecimal.valueOf(4.0));
        assertThat(result.getStrengths()).isEqualTo("Tốt");
    }

    @Test
    @DisplayName("selfEvaluate — trạng thái phiếu không đúng → ném ngoại lệ")
    void selfEvaluate_WrongStatus_ThrowsException() {
        PerformanceReview review = PerformanceReview.builder()
                .id(100L)
                .status("COMPLETED")
                .build();

        when(performanceReviewRepository.findById(100L)).thenReturn(Optional.of(review));

        assertThatThrownBy(() -> performanceService.selfEvaluate(
                100L, BigDecimal.valueOf(4.0), "Tốt", "Cần cải thiện", "Đạt KPI"
        ))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("Phiếu đánh giá đã chuyển sang giai đoạn tiếp theo");
    }

    @Test
    @DisplayName("managerEvaluate — chấm điểm KPI, tính điểm có trọng số, xếp loại và COMPLETED")
    void managerEvaluate_Success_WithKpis() {
        PerformanceReview review = PerformanceReview.builder()
                .id(100L)
                .status("MANAGER_EVALUATING")
                .build();

        KpiRecordDto kpi1 = KpiRecordDto.builder()
                .kpiName("KPI 1")
                .weight(BigDecimal.valueOf(60)) // 60%
                .score(BigDecimal.valueOf(4.5))
                .build();
        KpiRecordDto kpi2 = KpiRecordDto.builder()
                .kpiName("KPI 2")
                .weight(BigDecimal.valueOf(40)) // 40%
                .score(BigDecimal.valueOf(4.0))
                .build();

        when(performanceReviewRepository.findById(100L)).thenReturn(Optional.of(review));
        when(performanceReviewRepository.save(any(PerformanceReview.class))).thenAnswer(i -> i.getArgument(0));

        PerformanceReview result = performanceService.managerEvaluate(
                100L, BigDecimal.valueOf(4.2), List.of(kpi1, kpi2)
        );

        // Weighted score = (4.5 * 60 + 4.0 * 40) / 100 = 4.30
        assertThat(result.getStatus()).isEqualTo("COMPLETED");
        assertThat(result.getFinalScore()).isEqualTo(BigDecimal.valueOf(4.30).setScale(2));
        assertThat(result.getRating()).isEqualTo("GOOD"); // score 4.3 >= 3.5 và < 4.5 -> GOOD
        verify(kpiRecordRepository, times(2)).save(any(KpiRecord.class));
    }

    @Test
    @DisplayName("managerEvaluate — không cấu hình KPI → dùng điểm ReviewerScore làm FinalScore")
    void managerEvaluate_NoKpis_UsesReviewerScore() {
        PerformanceReview review = PerformanceReview.builder()
                .id(100L)
                .status("MANAGER_EVALUATING")
                .build();

        when(performanceReviewRepository.findById(100L)).thenReturn(Optional.of(review));
        when(performanceReviewRepository.save(any(PerformanceReview.class))).thenAnswer(i -> i.getArgument(0));

        PerformanceReview result = performanceService.managerEvaluate(
                100L, BigDecimal.valueOf(4.8), Collections.emptyList()
        );

        assertThat(result.getStatus()).isEqualTo("COMPLETED");
        assertThat(result.getFinalScore()).isEqualTo(BigDecimal.valueOf(4.8));
        assertThat(result.getRating()).isEqualTo("EXCELLENT"); // score 4.8 >= 4.5 -> EXCELLENT
    }
}
