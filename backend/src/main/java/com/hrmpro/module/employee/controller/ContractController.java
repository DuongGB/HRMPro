package com.hrmpro.module.employee.controller;

import com.hrmpro.common.dto.ApiResponse;
import com.hrmpro.module.employee.dto.ContractRequest;
import com.hrmpro.module.employee.dto.ContractResponse;
import com.hrmpro.module.employee.service.ContractService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
public class ContractController {

    private final ContractService contractService;

    @GetMapping("/employees/{employeeId}/contracts")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'HR_ADMIN', 'HR_STAFF') or @hrmSecurity.isSelf(#employeeId)")
    public ResponseEntity<ApiResponse<List<ContractResponse>>> getContractsByEmployee(@PathVariable Long employeeId) {
        List<ContractResponse> list = contractService.getContractsByEmployee(employeeId);
        return ResponseEntity.ok(ApiResponse.ok("Lấy danh sách hợp đồng thành công", list));
    }

    @GetMapping("/contracts/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'HR_ADMIN', 'HR_STAFF')")
    public ResponseEntity<ApiResponse<ContractResponse>> getContract(@PathVariable Long id) {
        ContractResponse response = contractService.getContract(id);
        return ResponseEntity.ok(ApiResponse.ok("Lấy chi tiết hợp đồng thành công", response));
    }

    @PostMapping(value = "/employees/{employeeId}/contracts", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'HR_ADMIN')")
    public ResponseEntity<ApiResponse<ContractResponse>> createContract(
            @PathVariable Long employeeId,
            @RequestPart("request") @Valid ContractRequest request,
            @RequestPart(value = "file", required = false) MultipartFile file
    ) {
        ContractResponse response = contractService.createContract(employeeId, request, file);
        return ResponseEntity.ok(ApiResponse.ok("Tạo hợp đồng lao động thành công", response));
    }

    @PutMapping(value = "/contracts/{id}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'HR_ADMIN')")
    public ResponseEntity<ApiResponse<ContractResponse>> updateContract(
            @PathVariable Long id,
            @RequestPart("request") @Valid ContractRequest request,
            @RequestPart(value = "file", required = false) MultipartFile file
    ) {
        ContractResponse response = contractService.updateContract(id, request, file);
        return ResponseEntity.ok(ApiResponse.ok("Cập nhật hợp đồng thành công", response));
    }

    @DeleteMapping("/contracts/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'HR_ADMIN')")
    public ResponseEntity<ApiResponse<Void>> deleteContract(@PathVariable Long id) {
        contractService.deleteContract(id);
        return ResponseEntity.ok(ApiResponse.ok("Xóa hợp đồng thành công", null));
    }
}
