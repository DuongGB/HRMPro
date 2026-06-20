package com.hrmpro.module.performance.repository;

import com.hrmpro.module.performance.entity.ReviewCycle;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ReviewCycleRepository extends JpaRepository<ReviewCycle, Long> {
    List<ReviewCycle> findAllByOrderByCreatedAtDesc();
}
