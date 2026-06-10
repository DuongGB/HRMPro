package com.hrmpro.module.employee.repository;

import com.hrmpro.module.employee.entity.Employee;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface EmployeeRepository extends JpaRepository<Employee, Long> {
    Optional<Employee> findByEmployeeCode(String employeeCode);
    boolean existsByEmployeeCode(String employeeCode);
    boolean existsByEmail(String email);

    @Query("SELECT e FROM Employee e WHERE " +
           "(:search IS NULL OR LOWER(e.firstName) LIKE :search " +
           "OR LOWER(e.lastName) LIKE :search " +
           "OR LOWER(e.employeeCode) LIKE :search " +
           "OR LOWER(e.email) LIKE :search) " +
           "AND (:departmentId IS NULL OR e.department.id = :departmentId) " +
           "AND (:status IS NULL OR e.status = :status)")
    Page<Employee> findEmployeesWithFilters(
            @Param("search") String search,
            @Param("departmentId") Long departmentId,
            @Param("status") String status,
            Pageable pageable
    );
}
