package com.hrmpro.module.payroll.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PayrollRunCreateDto {

    @NotNull(message = "Năm không được để trống")
    @Min(2020)
    private Integer year;

    @NotNull(message = "Tháng không được để trống")
    @Min(1)
    @Max(12)
    private Integer month;

    private String notes;
}
