package com.hrmpro.module.payroll.dto;

import lombok.*;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PayslipResponseDto {
    private Long id;
    private Long payrollRunId;
    private Integer year;
    private Integer month;
    private Long employeeId;
    private String employeeCode;
    private String employeeName;
    private String departmentName;
    private String positionName;
    private BigDecimal baseSalary;
    private BigDecimal totalAllowances;
    private BigDecimal grossSalary;
    private BigDecimal socialInsurance;
    private BigDecimal healthInsurance;
    private BigDecimal unemployment;
    private BigDecimal taxableIncome;
    private BigDecimal personalIncomeTax;
    private BigDecimal otherDeductions;
    private BigDecimal netSalary;
    private BigDecimal actualWorkDays;
    private BigDecimal standardWorkDays;
    private String pdfUrl;
}
