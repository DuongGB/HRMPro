package com.hrmpro.module.payroll.dto;

import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PayrollRunDto {
    private Long id;
    private Integer year;
    private Integer month;
    private String status; // DRAFT|PROCESSING|COMPLETED|PUBLISHED
    private Long runById;
    private String runByName;
    private LocalDateTime runAt;
    private LocalDateTime publishedAt;
    private String notes;
}
