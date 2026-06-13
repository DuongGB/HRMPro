package com.hrmpro.module.attendance.repository;

import com.hrmpro.module.attendance.entity.AttendanceLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface AttendanceLogRepository extends JpaRepository<AttendanceLog, Long> {
    
    Optional<AttendanceLog> findByEmployeeIdAndWorkDate(Long employeeId, LocalDate workDate);
    
    List<AttendanceLog> findByEmployeeIdAndWorkDateBetween(Long employeeId, LocalDate startDate, LocalDate endDate);
    
    Page<AttendanceLog> findByEmployeeId(Long employeeId, Pageable pageable);

    @Query("SELECT a FROM AttendanceLog a WHERE " +
           "(:employeeId IS NULL OR a.employee.id = :employeeId) " +
           "AND (:startDate IS NULL OR a.workDate >= :startDate) " +
           "AND (:endDate IS NULL OR a.workDate <= :endDate) " +
           "AND (:status IS NULL OR a.status = :status) " +
           "AND (:managerId IS NULL OR a.employee.manager.id = :managerId) " +
           "AND (:departmentId IS NULL OR a.employee.department.id = :departmentId)")
    Page<AttendanceLog> findAttendanceLogsWithFilters(
            @Param("employeeId") Long employeeId,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate,
            @Param("status") String status,
            @Param("managerId") Long managerId,
            @Param("departmentId") Long departmentId,
            Pageable pageable
    );
}
