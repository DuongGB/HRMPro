package com.hrmpro.module.organization.repository;

import com.hrmpro.module.organization.entity.Position;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PositionRepository extends JpaRepository<Position, Long> {
    Optional<Position> findByCode(String code);
    boolean existsByCode(String code);
    List<Position> findByDepartmentId(Long departmentId);
}
