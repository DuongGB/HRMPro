package com.hrmpro.module.performance.entity;

import com.hrmpro.module.employee.entity.Employee;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "performance_reviews", uniqueConstraints = {
        @UniqueConstraint(columnNames = {"cycle_id", "employee_id", "reviewer_id"})
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PerformanceReview {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "cycle_id", nullable = false)
    private ReviewCycle cycle;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "employee_id", nullable = false)
    private Employee employee;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reviewer_id", nullable = false)
    private Employee reviewer;

    @Column(name = "self_score", precision = 4, scale = 2)
    private BigDecimal selfScore;

    @Column(name = "reviewer_score", precision = 4, scale = 2)
    private BigDecimal reviewerScore;

    @Column(name = "final_score", precision = 4, scale = 2)
    private BigDecimal finalScore;

    @Column(length = 20)
    private String rating; // EXCELLENT|GOOD|MEETS|BELOW|POOR

    private String strengths;
    private String improvements;

    @Column(name = "goals_next")
    private String goalsNext;

    @Column(length = 20)
    @Builder.Default
    private String status = "PENDING"; // PENDING|SELF_EVALUATING|MANAGER_EVALUATING|COMPLETED

    @Column(name = "completed_at")
    private LocalDateTime completedAt;
}
