package com.hrmpro.module.attendance.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CheckInRequest {
    private String ipAddress;
    private String location;
    private String note;
}
