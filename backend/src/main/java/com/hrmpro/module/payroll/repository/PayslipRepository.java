package com.hrmpro.module.payroll.repository;

import com.hrmpro.module.payroll.entity.Payslip;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PayslipRepository extends JpaRepository<Payslip, Long> {
    
    List<Payslip> findByPayrollRunId(Long payrollRunId);
    
    List<Payslip> findByEmployeeId(Long employeeId);
    
    Optional<Payslip> findByPayrollRunIdAndEmployeeId(Long payrollRunId, Long employeeId);

    @Query("SELECT p FROM Payslip p WHERE p.employee.id = :employeeId AND p.payrollRun.status = 'PUBLISHED' ORDER BY p.payrollRun.year DESC, p.payrollRun.month DESC")
    List<Payslip> findPublishedPayslipsByEmployeeId(Long employeeId);

    void deleteByPayrollRunId(Long payrollRunId);
}
