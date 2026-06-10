package com.hrmpro.module.organization.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.*;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DepartmentRequest {

    @NotBlank(message = "Mã phòng ban không được để trống")
    @Size(max = 20, message = "Mã phòng ban tối đa 20 ký tự")
    private String code;

    @NotBlank(message = "Tên phòng ban không được để trống")
    @Size(max = 200, message = "Tên phòng ban tối đa 200 ký tự")
    private String name;

    private Long parentId;

    private Long managerId;

    private String description;

    private List<Long> childrenIds;
}
