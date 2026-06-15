package com.hrmpro.module.employee.repository;

import com.hrmpro.module.employee.entity.Contract;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface ContractRepository extends JpaRepository<Contract, Long> {
    List<Contract> findByEmployeeId(Long employeeId);
    Optional<Contract> findByContractNumber(String contractNumber);
    boolean existsByContractNumber(String contractNumber);

    @Query("SELECT c FROM Contract c WHERE c.status = 'ACTIVE' AND (c.endDate = :date15 OR c.endDate = :date30)")
    List<Contract> findExpiringContracts(@Param("date15") LocalDate date15, @Param("date30") LocalDate date30);
}
