package com.hrmpro.module.performance.service;

import com.hrmpro.module.employee.entity.Employee;
import com.hrmpro.module.employee.repository.EmployeeRepository;
import com.hrmpro.module.performance.dto.KpiRecordDto;
import com.hrmpro.module.performance.dto.PerformanceReviewDto;
import com.hrmpro.module.performance.entity.KpiRecord;
import com.hrmpro.module.performance.entity.PerformanceReview;
import com.hrmpro.module.performance.entity.ReviewCycle;
import com.hrmpro.module.performance.repository.KpiRecordRepository;
import com.hrmpro.module.performance.repository.PerformanceReviewRepository;
import com.hrmpro.module.performance.repository.ReviewCycleRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class PerformanceService {

    private final ReviewCycleRepository reviewCycleRepository;
    private final PerformanceReviewRepository performanceReviewRepository;
    private final KpiRecordRepository kpiRecordRepository;
    private final EmployeeRepository employeeRepository;

    // ─── REVIEW CYCLE LOGIC ───────────────────────────────────────────────────────

    public List<ReviewCycle> getAllCycles() {
        return reviewCycleRepository.findAllByOrderByCreatedAtDesc();
    }

    public ReviewCycle getCycle(Long id) {
        return reviewCycleRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy kỳ đánh giá ID: " + id));
    }

    @Transactional
    public ReviewCycle createCycle(ReviewCycle cycle) {
        cycle.setCreatedAt(LocalDateTime.now());
        cycle.setStatus("DRAFT");
        return reviewCycleRepository.save(cycle);
    }

    @Transactional
    public ReviewCycle updateCycleStatus(Long id, String status) {
        ReviewCycle cycle = getCycle(id);
        cycle.setStatus(status);

        if ("ACTIVE".equals(status)) {
            // Khi kích hoạt kỳ đánh giá, tự động tạo phiếu đánh giá cho tất cả nhân viên đang hoạt động
            generateReviewsForCycle(cycle);
        }

        return reviewCycleRepository.save(cycle);
    }

    private void generateReviewsForCycle(ReviewCycle cycle) {
        List<Employee> activeEmployees = employeeRepository.findAll().stream()
                .filter(e -> "ACTIVE".equals(e.getStatus()) || "PROBATION".equals(e.getStatus()))
                .collect(Collectors.toList());

        for (Employee emp : activeEmployees) {
            // Kiểm tra xem đã tồn tại phiếu đánh giá chưa
            // Tránh tạo trùng lặp nếu kích hoạt lại
            Optional<PerformanceReview> existing = performanceReviewRepository.findByCycleIdAndEmployeeId(cycle.getId(), emp.getId());
            if (existing.isPresent()) {
                continue;
            }

            // Người đánh giá là Manager trực tiếp, nếu không có Manager thì mặc định là chính họ hoặc Super Admin (id = 1)
            Employee reviewer = emp.getManager() != null ? emp.getManager() : Employee.builder().id(1L).build();

            PerformanceReview review = PerformanceReview.builder()
                    .cycle(cycle)
                    .employee(emp)
                    .reviewer(reviewer)
                    .status("PENDING")
                    .build();

            performanceReviewRepository.save(review);
        }
    }

    // ─── PERFORMANCE REVIEW LOGIC ─────────────────────────────────────────────────

    public List<PerformanceReview> getReviewsByEmployee(Long employeeId) {
        return performanceReviewRepository.findByEmployeeId(employeeId);
    }

    public List<PerformanceReview> getReviewsByReviewer(Long reviewerId) {
        return performanceReviewRepository.findByReviewerId(reviewerId);
    }

    public List<PerformanceReview> getReviewsByCycle(Long cycleId) {
        return performanceReviewRepository.findByCycleId(cycleId);
    }

    public PerformanceReview getReview(Long id) {
        return performanceReviewRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy phiếu đánh giá ID: " + id));
    }

    /**
     * Nhân viên tự điền phiếu đánh giá
     */
    @Transactional
    public PerformanceReview selfEvaluate(Long reviewId, BigDecimal selfScore, String strengths, String improvements, String goalsNext) {
        PerformanceReview review = getReview(reviewId);

        if (!"PENDING".equals(review.getStatus()) && !"SELF_EVALUATING".equals(review.getStatus())) {
            throw new RuntimeException("Phiếu đánh giá đã chuyển sang giai đoạn tiếp theo, không thể tự sửa.");
        }

        review.setSelfScore(selfScore);
        review.setStrengths(strengths);
        review.setImprovements(improvements);
        review.setGoalsNext(goalsNext);
        review.setStatus("MANAGER_EVALUATING"); // Chuyển sang cho quản lý chấm điểm

        return performanceReviewRepository.save(review);
    }

    /**
     * Quản lý đánh giá và chấm điểm KPI
     */
    @Transactional
    public PerformanceReview managerEvaluate(Long reviewId, BigDecimal reviewerScore, List<KpiRecordDto> kpis) {
        PerformanceReview review = getReview(reviewId);

        if (!"MANAGER_EVALUATING".equals(review.getStatus()) && !"PENDING".equals(review.getStatus())) {
            throw new RuntimeException("Chỉ được chấm điểm khi phiếu đang ở trạng thái chờ quản lý đánh giá.");
        }

        // Xóa KPI cũ nếu có để ghi đè lại
        kpiRecordRepository.deleteByReviewId(review.getId());

        BigDecimal finalScore = BigDecimal.ZERO;
        BigDecimal totalWeight = BigDecimal.ZERO;

        List<KpiRecord> kpiEntities = new ArrayList<>();
        for (KpiRecordDto kpiDto : kpis) {
            KpiRecord kpi = KpiRecord.builder()
                    .review(review)
                    .kpiName(kpiDto.getKpiName())
                    .weight(kpiDto.getWeight())
                    .target(kpiDto.getTarget())
                    .actual(kpiDto.getActual())
                    .score(kpiDto.getScore())
                    .build();
            
            kpiEntities.add(kpi);
            kpiRecordRepository.save(kpi);

            // Tính điểm trung bình có trọng số của KPI
            if (kpi.getScore() != null && kpi.getWeight() != null) {
                BigDecimal kpiContribution = kpi.getScore().multiply(kpi.getWeight());
                finalScore = finalScore.add(kpiContribution);
                totalWeight = totalWeight.add(kpi.getWeight());
            }
        }

        // Tính finalScore = tổng đóng góp / tổng trọng số.
        // Ví dụ tổng trọng số đạt 100% -> chia cho 100.
        if (totalWeight.compareTo(BigDecimal.ZERO) > 0) {
            finalScore = finalScore.divide(totalWeight, 2, RoundingMode.HALF_UP);
        } else {
            // Nếu không có KPI nào được cấu hình, lấy điểm đánh giá của reviewer làm điểm cuối cùng
            finalScore = reviewerScore;
        }

        // Xếp loại dựa trên finalScore
        String rating = calculateRating(finalScore);

        review.setReviewerScore(reviewerScore);
        review.setFinalScore(finalScore);
        review.setRating(rating);
        review.setStatus("COMPLETED");
        review.setCompletedAt(LocalDateTime.now());

        return performanceReviewRepository.save(review);
    }

    private String calculateRating(BigDecimal score) {
        if (score == null) return "MEETS";
        double val = score.doubleValue();
        if (val >= 4.5) return "EXCELLENT";
        if (val >= 3.5) return "GOOD";
        if (val >= 2.5) return "MEETS";
        if (val >= 1.5) return "BELOW";
        return "POOR";
    }

    public List<KpiRecord> getKpisByReview(Long reviewId) {
        return kpiRecordRepository.findByReviewId(reviewId);
    }
}
