package com.hrmpro.module.leave.entity;

import com.hrmpro.module.employee.entity.Employee;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

@Entity
@Table(name = "leave_balances", uniqueConstraints = {
        @UniqueConstraint(columnNames = {"employee_id", "leave_type_id", "year"})
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LeaveBalance {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "employee_id", nullable = false)
    private Employee employee;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "leave_type_id", nullable = false)
    private LeaveType leaveType;

    @Column(nullable = false)
    private Integer year;

    @Column(name = "total_days", precision = 5, scale = 1)
    @Builder.Default
    private BigDecimal totalDays = BigDecimal.ZERO;

    @Column(name = "used_days", precision = 5, scale = 1)
    @Builder.Default
    private BigDecimal usedDays = BigDecimal.ZERO;

    @Column(name = "pending_days", precision = 5, scale = 1)
    @Builder.Default
    private BigDecimal pendingDays = BigDecimal.ZERO;

    // Cột tính toán tự động từ DB nên không chèn hoặc cập nhật từ JPA
    @Column(name = "remaining_days", insertable = false, updatable = false, precision = 5, scale = 1)
    private BigDecimal remainingDays;
}
