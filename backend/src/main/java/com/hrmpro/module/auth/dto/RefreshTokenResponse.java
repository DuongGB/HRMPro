package com.hrmpro.module.auth.dto;

public record RefreshTokenResponse(
    String accessToken,
    String tokenType,
    long expiresIn
) {}
