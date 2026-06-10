package com.hrmpro.module.employee.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ContractRequest {

    @NotBlank(message = "Số hợp đồng không được để trống")
    @Size(max = 50, message = "Số hợp đồng tối đa 50 ký tự")
    private String contractNumber;

    private String contractType; // PROBATION|FIXED_TERM_1Y|FIXED_TERM_3Y|INDEFINITE

    @NotNull(message = "Ngày bắt đầu hợp đồng không được để trống")
    private LocalDate startDate;

    private LocalDate endDate;

    @NotNull(message = "Lương cơ bản không được để trống")
    private BigDecimal baseSalary;

    private LocalDate signedAt;

    private String notes;
}
