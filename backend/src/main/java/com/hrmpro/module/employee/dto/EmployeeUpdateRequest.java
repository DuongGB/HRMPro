package com.hrmpro.module.employee.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.*;

import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EmployeeUpdateRequest {

    @NotBlank(message = "Tên (First Name) không được để trống")
    @Size(max = 100, message = "Tên tối đa 100 ký tự")
    private String firstName;

    @NotBlank(message = "Họ (Last Name) không được để trống")
    @Size(max = 100, message = "Họ tối đa 100 ký tự")
    private String lastName;

    @NotBlank(message = "Email công việc không được để trống")
    @Email(message = "Email không hợp lệ")
    @Size(max = 150, message = "Email tối đa 150 ký tự")
    private String email;

    @Email(message = "Email cá nhân không hợp lệ")
    @Size(max = 150, message = "Email cá nhân tối đa 150 ký tự")
    private String personalEmail;

    @Size(max = 20, message = "Số điện thoại tối đa 20 ký tự")
    private String phone;

    private LocalDate dateOfBirth;

    private String gender; // MALE|FEMALE|OTHER

    @Size(max = 20, message = "Số CCCD/CMND tối đa 20 ký tự")
    private String idCardNumber;

    private LocalDate idCardIssuedDate;

    @Size(max = 200, message = "Nơi cấp CCCD tối đa 200 ký tự")
    private String idCardIssuedPlace;

    private String permanentAddress;

    private String currentAddress;

    private LocalDate probationEndDate;

    private Long departmentId;

    private Long positionId;

    private Long managerId;

    @Size(max = 20, message = "Mã số thuế tối đa 20 ký tự")
    private String taxCode;

    @Size(max = 30, message = "Số tài khoản ngân hàng tối đa 30 ký tự")
    private String bankAccountNumber;

    @Size(max = 100, message = "Tên ngân hàng tối đa 100 ký tự")
    private String bankName;

    @Size(max = 20, message = "Mã số BHXH tối đa 20 ký tự")
    private String socialInsuranceId;
}
