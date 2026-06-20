package com.hrmpro.module.payroll.dto;

import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SalaryConfigDto {
    private Long id;

    @NotNull(message = "Ngày hiệu lực không được để trống")
    private LocalDate effectiveDate;

    @NotNull(message = "Lương tối thiểu vùng không được để trống")
    private BigDecimal minWage;

    @Builder.Default
    private BigDecimal socialInsuranceRate = BigDecimal.valueOf(8.00);

    @Builder.Default
    private BigDecimal healthInsuranceRate = BigDecimal.valueOf(1.50);

    @Builder.Default
    private BigDecimal unemploymentRate = BigDecimal.valueOf(1.00);

    @Builder.Default
    private BigDecimal personalDeduction = BigDecimal.valueOf(11000000);

    @Builder.Default
    private BigDecimal dependentDeduction = BigDecimal.valueOf(4400000);

    private Boolean isActive;
}
