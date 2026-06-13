package com.hrmpro.module.leave.repository;

import com.hrmpro.module.leave.entity.LeaveRequest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface LeaveRequestRepository extends JpaRepository<LeaveRequest, Long> {

    List<LeaveRequest> findByEmployeeId(Long employeeId);

    @Query("SELECT r FROM LeaveRequest r WHERE " +
           "(:employeeId IS NULL OR r.employee.id = :employeeId) " +
           "AND (:managerId IS NULL OR r.employee.manager.id = :managerId) " +
           "AND (:status IS NULL OR r.status = :status) " +
           "AND (r.startDate >= COALESCE(:startDate, r.startDate)) " +
           "AND (r.endDate <= COALESCE(:endDate, r.endDate)) " +
           "AND (:departmentId IS NULL OR r.employee.department.id = :departmentId)")
    Page<LeaveRequest> findLeaveRequestsWithFilters(
            @Param("employeeId") Long employeeId,
            @Param("managerId") Long managerId,
            @Param("status") String status,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate,
            @Param("departmentId") Long departmentId,
            Pageable pageable
    );

    @Query("SELECT r FROM LeaveRequest r WHERE r.employee.manager.id = :managerId AND r.status = 'PENDING'")
    List<LeaveRequest> findPendingRequestsByManager(@Param("managerId") Long managerId);
}
