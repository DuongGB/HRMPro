package com.hrmpro.module.attendance.dto;

import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AttendanceLogResponse {
    private Long id;
    private Long employeeId;
    private String employeeCode;
    private String employeeName;
    private LocalDate workDate;
    private LocalDateTime checkIn;
    private LocalDateTime checkOut;
    private String checkInIp;
    private String checkInLocation;
    private String status;
    private Integer checkCount;
    private String note;
    private Long departmentId;
    private String departmentName;
    private Long approvedById;
    private String approvedByName;
}
