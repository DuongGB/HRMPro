package com.hrmpro.module.auth.dto;

import lombok.*;

import java.time.LocalDateTime;
import java.util.Set;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserResponse {
    private Long id;
    private String username;
    private Long employeeId;
    private String employeeCode;
    private String employeeName;
    private String avatarUrl;
    private Boolean isActive;
    private Set<String> roles;
    private LocalDateTime createdAt;
}
