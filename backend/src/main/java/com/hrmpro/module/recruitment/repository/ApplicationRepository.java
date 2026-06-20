package com.hrmpro.module.recruitment.repository;

import com.hrmpro.module.recruitment.entity.Application;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ApplicationRepository extends JpaRepository<Application, Long> {
    List<Application> findByJobPostingId(Long jobPostingId);
    List<Application> findAllByOrderByAppliedAtDesc();
}
