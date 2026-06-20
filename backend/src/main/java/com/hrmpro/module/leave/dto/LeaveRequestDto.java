package com.hrmpro.module.leave.dto;

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
public class LeaveRequestDto {

    @NotBlank(message = "Mã loại nghỉ phép không được để trống")
    private String leaveTypeCode; // ANNUAL|SICK|UNPAID...

    @NotNull(message = "Ngày bắt đầu nghỉ không được để trống")
    private LocalDate startDate;

    @NotNull(message = "Ngày kết thúc nghỉ không được để trống")
    private LocalDate endDate;

    @NotNull(message = "Tổng số ngày nghỉ không được để trống")
    private BigDecimal totalDays;

    private String reason;
}
