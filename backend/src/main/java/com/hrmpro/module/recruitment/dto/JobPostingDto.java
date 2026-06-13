package com.hrmpro.module.recruitment.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class JobPostingDto {
    private Long id;

    @NotBlank(message = "Tiêu đề tuyển dụng không được để trống")
    private String title;

    private Long departmentId;
    private String departmentName;
    private Long positionId;
    private String positionName;
    private String description;
    private String requirements;
    private String salaryRange;
    private Integer headcount;
    private LocalDate postingDate;
    private LocalDate closingDate;
    private String status; // OPEN|CLOSED|PAUSED|FILLED
    private Long createdById;
    private String createdByName;
}
