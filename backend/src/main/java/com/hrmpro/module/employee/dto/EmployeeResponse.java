package com.hrmpro.module.employee.dto;

import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EmployeeResponse {
    private Long id;
    private String employeeCode;
    private String firstName;
    private String lastName;
    private String fullName;
    private String email;
    private String personalEmail;
    private String phone;
    private LocalDate dateOfBirth;
    private String gender;
    private String idCardNumber;
    private LocalDate idCardIssuedDate;
    private String idCardIssuedPlace;
    private String permanentAddress;
    private String currentAddress;
    private String avatarUrl;
    private LocalDate hireDate;
    private LocalDate probationEndDate;
    private LocalDate terminationDate;
    private String status; 
    
    private Long departmentId;
    private String departmentName;
    private Long positionId;
    private String positionName;
    private Long managerId;
    private String managerName;
    
    private String taxCode;
    private String bankAccountNumber;
    private String bankName;
    private String socialInsuranceId;
    
    private Boolean isLinked;
    
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
