package com.hrmpro.module.performance.repository;

import com.hrmpro.module.performance.entity.PerformanceReview;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PerformanceReviewRepository extends JpaRepository<PerformanceReview, Long> {
    List<PerformanceReview> findByEmployeeId(Long employeeId);
    List<PerformanceReview> findByReviewerId(Long reviewerId);
    List<PerformanceReview> findByCycleId(Long cycleId);
    Optional<PerformanceReview> findByCycleIdAndEmployeeId(Long cycleId, Long employeeId);
}
