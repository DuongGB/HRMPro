package com.hrmpro.module.leave.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

@Entity
@Table(name = "leave_types")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LeaveType {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false, length = 30)
    private String code; // ANNUAL|SICK|UNPAID|MATERNITY|PATERNITY|BEREAVEMENT|MARRIAGE

    @Column(nullable = false, length = 100)
    private String name;

    @Column(name = "days_per_year", precision = 5, scale = 1)
    private BigDecimal daysPerYear;

    @Column(name = "is_paid")
    @Builder.Default
    private Boolean isPaid = true;

    @Column(name = "requires_approval")
    @Builder.Default
    private Boolean requiresApproval = true;

    @Column(name = "carry_over_days", precision = 5, scale = 1)
    @Builder.Default
    private BigDecimal carryOverDays = BigDecimal.ZERO;

    private String description;
}
