package com.hrmpro.module.attendance.entity;

import com.hrmpro.module.employee.entity.Employee;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "attendance_logs", uniqueConstraints = {
        @UniqueConstraint(columnNames = {"employee_id", "work_date"})
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AttendanceLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "employee_id", nullable = false)
    private Employee employee;

    @Column(name = "work_date", nullable = false)
    private LocalDate workDate;

    @Column(name = "check_in")
    private LocalDateTime checkIn;

    @Column(name = "check_out")
    private LocalDateTime checkOut;

    @Column(name = "check_in_ip", length = 45)
    private String checkInIp;

    @Column(name = "check_in_location", length = 200)
    private String checkInLocation;

    @Column(length = 20)
    private String status; // ON_TIME|LATE|EARLY_LEAVE|ABSENT|HOLIDAY|LEAVE|PENDING_ADJUST|ADJUSTED

    @Column(name = "check_count")
    @Builder.Default
    private Integer checkCount = 0; // Số lần chấm công trong ngày

    private String note;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "approved_by")
    private Employee approvedBy;
}
