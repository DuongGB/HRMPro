package com.hrmpro.module.attendance.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AttendanceAdjustmentRequest {

    @NotNull(message = "Ngày công không được để trống")
    private LocalDate workDate;

    private LocalDateTime checkIn;

    private LocalDateTime checkOut;

    @NotBlank(message = "Lý do điều chỉnh không được để trống")
    private String note;
}
