package com.hrmpro.module.employee.dto;

import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ContractResponse {
    private Long id;
    private Long employeeId;
    private String employeeCode;
    private String employeeName;
    private String contractNumber;
    private String contractType;
    private LocalDate startDate;
    private LocalDate endDate;
    private BigDecimal baseSalary;
    private String documentUrl;
    private String status;
    private LocalDate signedAt;
    private String notes;
}
