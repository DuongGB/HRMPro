package com.hrmpro.module.organization.dto;

import lombok.*;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DepartmentResponse {
    private Long id;
    private String code;
    private String name;
    private Long parentId;
    private String parentName;
    private Long managerId;
    private String managerCode;
    private String managerName;
    private String description;
    private Boolean isActive;
    private List<DepartmentResponse> children; // Hỗ trợ cấu trúc cây phòng ban
}
