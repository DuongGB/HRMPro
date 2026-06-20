package com.hrmpro.module.organization.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PositionResponse {
    private Long id;
    private String code;
    private String name;
    private Long departmentId;
    private String departmentName;
    private String level;
    private String description;
    private Boolean isActive;
}
