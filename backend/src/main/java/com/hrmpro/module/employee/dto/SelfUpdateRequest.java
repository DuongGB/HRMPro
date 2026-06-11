package com.hrmpro.module.employee.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Size;
import lombok.*;

/**
 * DTO cho phép nhân viên tự cập nhật thông tin cá nhân hạn chế.
 * Các trường nhạy cảm (email công ty, phòng ban, lương...) KHÔNG nằm ở đây.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SelfUpdateRequest {

    @Size(max = 20, message = "Số điện thoại không vượt quá 20 ký tự")
    private String phone;

    @Email(message = "Email cá nhân không hợp lệ")
    @Size(max = 100, message = "Email cá nhân không vượt quá 100 ký tự")
    private String personalEmail;

    @Size(max = 500, message = "Địa chỉ tạm trú không vượt quá 500 ký tự")
    private String currentAddress;
}
