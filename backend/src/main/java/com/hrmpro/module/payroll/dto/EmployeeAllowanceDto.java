package com.hrmpro.module.payroll.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EmployeeAllowanceDto {
    private Long id;

    @NotNull(message = "ID nhân viên không được để trống")
    private Long employeeId;
    
    private String employeeName;
    private String employeeCode;

    @NotBlank(message = "Loại phụ cấp không được để trống")
    private String allowanceType; // MEAL|TRANSPORT|PHONE|HOUSING|RESPONSIBILITY

    @NotNull(message = "Số tiền phụ cấp không được để trống")
    private BigDecimal amount;

    @Builder.Default
    private Boolean isTaxable = false;

    @NotNull(message = "Ngày hiệu lực không được để trống")
    private LocalDate effectiveDate;
    
    private LocalDate endDate;
}
