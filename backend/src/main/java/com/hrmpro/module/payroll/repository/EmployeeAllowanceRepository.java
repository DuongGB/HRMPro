package com.hrmpro.module.payroll.repository;

import com.hrmpro.module.payroll.entity.EmployeeAllowance;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface EmployeeAllowanceRepository extends JpaRepository<EmployeeAllowance, Long> {
    
    List<EmployeeAllowance> findByEmployeeId(Long employeeId);

    @Query("SELECT a FROM EmployeeAllowance a WHERE a.employee.id = :employeeId " +
           "AND a.effectiveDate <= :endDate " +
           "AND (a.endDate IS NULL OR a.endDate >= :startDate)")
    List<EmployeeAllowance> findActiveAllowances(Long employeeId, LocalDate startDate, LocalDate endDate);

    @Query("SELECT a FROM EmployeeAllowance a WHERE a.effectiveDate <= :endDate " +
           "AND (a.endDate IS NULL OR a.endDate >= :startDate)")
    List<EmployeeAllowance> findAllActiveAllowancesInPeriod(LocalDate startDate, LocalDate endDate);
}
