package com.hrmpro.module.payroll.repository;

import com.hrmpro.module.payroll.entity.SalaryConfig;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SalaryConfigRepository extends JpaRepository<SalaryConfig, Long> {
    Optional<SalaryConfig> findFirstByIsActiveTrueOrderByEffectiveDateDesc();
    List<SalaryConfig> findAllByOrderByEffectiveDateDesc();
}
