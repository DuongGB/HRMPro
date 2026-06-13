package com.hrmpro.module.payroll.repository;

import com.hrmpro.module.payroll.entity.PayrollRun;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PayrollRunRepository extends JpaRepository<PayrollRun, Long> {
    Optional<PayrollRun> findByYearAndMonth(Integer year, Integer month);
    List<PayrollRun> findAllByOrderByYearDescMonthDesc();
    boolean existsByYearAndMonth(Integer year, Integer month);
}
