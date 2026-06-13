package com.hrmpro.module.attendance.entity;

import com.hrmpro.module.employee.entity.Employee;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

@Entity
@Table(name = "attendance_summary", uniqueConstraints = {
        @UniqueConstraint(columnNames = {"employee_id", "year", "month"})
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AttendanceSummary {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "employee_id", nullable = false)
    private Employee employee;

    @Column(nullable = false)
    private Integer year;

    @Column(nullable = false)
    private Integer month;

    @Column(name = "work_days", precision = 5, scale = 1)
    @Builder.Default
    private BigDecimal workDays = BigDecimal.ZERO;

    @Column(name = "actual_days", precision = 5, scale = 1)
    @Builder.Default
    private BigDecimal actualDays = BigDecimal.ZERO;

    @Column(name = "late_count")
    @Builder.Default
    private Integer lateCount = 0;

    @Column(name = "absent_count")
    @Builder.Default
    private Integer absentCount = 0;

    @Column(name = "overtime_hours", precision = 6, scale = 2)
    @Builder.Default
    private BigDecimal overtimeHours = BigDecimal.ZERO;
}
