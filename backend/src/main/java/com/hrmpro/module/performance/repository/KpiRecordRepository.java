package com.hrmpro.module.performance.repository;

import com.hrmpro.module.performance.entity.KpiRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface KpiRecordRepository extends JpaRepository<KpiRecord, Long> {
    List<KpiRecord> findByReviewId(Long reviewId);
    void deleteByReviewId(Long reviewId);
}
