package com.hrmpro.module.organization.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PositionRequest {

    @NotBlank(message = "Mã chức danh không được để trống")
    @Size(max = 20, message = "Mã chức danh tối đa 20 ký tự")
    private String code;

    @NotBlank(message = "Tên chức danh không được để trống")
    @Size(max = 200, message = "Tên chức danh tối đa 200 ký tự")
    private String name;

    @NotNull(message = "ID phòng ban không được để trống")
    private Long departmentId;

    private String level; // INTERN|JUNIOR|MIDDLE|SENIOR|LEAD|MANAGER|DIRECTOR

    private String description;
}
