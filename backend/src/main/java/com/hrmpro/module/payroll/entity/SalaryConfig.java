package com.hrmpro.module.payroll.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "salary_configs")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SalaryConfig {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "effective_date", nullable = false)
    private LocalDate effectiveDate;

    @Column(name = "min_wage", precision = 15, scale = 2)
    private BigDecimal minWage;

    @Column(name = "social_insurance_rate", precision = 5, scale = 2)
    @Builder.Default
    private BigDecimal socialInsuranceRate = BigDecimal.valueOf(8.00);

    @Column(name = "health_insurance_rate", precision = 5, scale = 2)
    @Builder.Default
    private BigDecimal healthInsuranceRate = BigDecimal.valueOf(1.50);

    @Column(name = "unemployment_rate", precision = 5, scale = 2)
    @Builder.Default
    private BigDecimal unemploymentRate = BigDecimal.valueOf(1.00);

    @Column(name = "personal_deduction", precision = 15, scale = 2)
    @Builder.Default
    private BigDecimal personalDeduction = BigDecimal.valueOf(11000000);

    @Column(name = "dependent_deduction", precision = 15, scale = 2)
    @Builder.Default
    private BigDecimal dependentDeduction = BigDecimal.valueOf(4400000);

    @Column(name = "is_active")
    @Builder.Default
    private Boolean isActive = true;

    @Column(name = "created_at")
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
}
