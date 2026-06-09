package com.hrmpro.module.auth.dto;

import java.util.List;

public record UserResponse(
    Long id,
    String username,
    List<String> roles,
    Long employeeId
) {}
