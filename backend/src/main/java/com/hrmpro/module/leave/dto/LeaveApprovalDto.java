package com.hrmpro.module.leave.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LeaveApprovalDto {

    @NotBlank(message = "Trạng thái phê duyệt không được để trống")
    private String status; // APPROVED|REJECTED

    private String managerNote;
}
