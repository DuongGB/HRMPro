package com.hrmpro.module.payroll.entity;

import com.hrmpro.module.employee.entity.Employee;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "payroll_runs", uniqueConstraints = {
        @UniqueConstraint(columnNames = {"year", "month"})
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PayrollRun {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Integer year;

    @Column(nullable = false)
    private Integer month;

    @Column(length = 20)
    @Builder.Default
    private String status = "DRAFT"; // DRAFT|PROCESSING|COMPLETED|PUBLISHED

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "run_by")
    private Employee runBy;

    @Column(name = "run_at")
    private LocalDateTime runAt;

    @Column(name = "published_at")
    private LocalDateTime publishedAt;

    private String notes;
}
