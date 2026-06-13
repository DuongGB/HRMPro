package com.hrmpro.module.attendance.repository;

import com.hrmpro.module.attendance.entity.AttendanceSummary;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface AttendanceSummaryRepository extends JpaRepository<AttendanceSummary, Long> {
    Optional<AttendanceSummary> findByEmployeeIdAndYearAndMonth(Long employeeId, Integer year, Integer month);
}
