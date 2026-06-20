package com.hrmpro.module.performance.dto;

import lombok.*;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class KpiRecordDto {
    private Long id;
    private String kpiName;
    private BigDecimal weight; // % trọng số
    private String target;
    private String actual;
    private BigDecimal score;
}
