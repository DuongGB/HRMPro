package com.hrmpro.module.recruitment.repository;

import com.hrmpro.module.recruitment.entity.JobPosting;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface JobPostingRepository extends JpaRepository<JobPosting, Long> {
    List<JobPosting> findAllByOrderByCreatedAtDesc();
    List<JobPosting> findByStatus(String status);
}
