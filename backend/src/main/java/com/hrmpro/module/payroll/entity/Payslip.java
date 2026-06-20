package com.hrmpro.module.payroll.entity;

import com.hrmpro.module.employee.entity.Employee;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

@Entity
@Table(name = "payslips", uniqueConstraints = {
        @UniqueConstraint(columnNames = {"payroll_run_id", "employee_id"})
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Payslip {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "payroll_run_id", nullable = false)
    private PayrollRun payrollRun;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "employee_id", nullable = false)
    private Employee employee;

    @Column(name = "base_salary", precision = 15, scale = 2)
    @Builder.Default
    private BigDecimal baseSalary = BigDecimal.ZERO;

    @Column(name = "total_allowances", precision = 15, scale = 2)
    @Builder.Default
    private BigDecimal totalAllowances = BigDecimal.ZERO;

    @Column(name = "gross_salary", precision = 15, scale = 2)
    @Builder.Default
    private BigDecimal grossSalary = BigDecimal.ZERO;

    @Column(name = "social_insurance", precision = 15, scale = 2)
    @Builder.Default
    private BigDecimal socialInsurance = BigDecimal.ZERO;

    @Column(name = "health_insurance", precision = 15, scale = 2)
    @Builder.Default
    private BigDecimal healthInsurance = BigDecimal.ZERO;

    @Column(name = "unemployment", precision = 15, scale = 2)
    @Builder.Default
    private BigDecimal unemployment = BigDecimal.ZERO;

    @Column(name = "taxable_income", precision = 15, scale = 2)
    @Builder.Default
    private BigDecimal taxableIncome = BigDecimal.ZERO;

    @Column(name = "personal_income_tax", precision = 15, scale = 2)
    @Builder.Default
    private BigDecimal personalIncomeTax = BigDecimal.ZERO;

    @Column(name = "other_deductions", precision = 15, scale = 2)
    @Builder.Default
    private BigDecimal otherDeductions = BigDecimal.ZERO;

    @Column(name = "net_salary", precision = 15, scale = 2)
    @Builder.Default
    private BigDecimal netSalary = BigDecimal.ZERO;

    @Column(name = "actual_work_days", precision = 5, scale = 1)
    private BigDecimal actualWorkDays;

    @Column(name = "standard_work_days", precision = 5, scale = 1)
    private BigDecimal standardWorkDays;

    @Column(name = "pdf_url")
    private String pdfUrl;
}
