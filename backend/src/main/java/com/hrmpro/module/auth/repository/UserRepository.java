package com.hrmpro.module.auth.repository;

import com.hrmpro.module.auth.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import org.springframework.data.jpa.repository.Query;
import java.util.Optional;
import java.util.Set;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByUsername(String username);
    boolean existsByUsername(String username);
    Optional<User> findByEmployeeId(Long employeeId);
    boolean existsByEmployeeId(Long employeeId);

    @Query("SELECT u.employee.id FROM User u WHERE u.employee.id IS NOT NULL")
    Set<Long> findAllLinkedEmployeeIds();

    @Query("SELECT u FROM User u WHERE u.employee IS NOT NULL AND (u.employee.email = :email OR u.employee.personalEmail = :email)")
    Optional<User> findByEmployeeEmail(String email);

    Optional<User> findByResetToken(String resetToken);
}
