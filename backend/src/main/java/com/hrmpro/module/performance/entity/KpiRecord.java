package com.hrmpro.module.performance.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

@Entity
@Table(name = "kpi_records")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class KpiRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "review_id", nullable = false)
    private PerformanceReview review;

    @Column(name = "kpi_name", nullable = false, length = 200)
    private String kpiName;

    @Column(precision = 5, scale = 2)
    private BigDecimal weight; // % trọng số

    private String target;
    private String actual;

    @Column(precision = 4, scale = 2)
    private BigDecimal score;
}
