package com.hrmpro.module.performance.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ReviewCycleDto {
    private Long id;

    @NotBlank(message = "Tên kỳ đánh giá không được để trống")
    private String name;

    private String cycleType; // QUARTERLY|SEMI_ANNUAL|ANNUAL
    private LocalDate startDate;
    private LocalDate endDate;
    private String status; // DRAFT|ACTIVE|COMPLETED
}
