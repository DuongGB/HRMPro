package com.hrmpro.module.payroll.controller;

import com.hrmpro.common.dto.ApiResponse;
import com.hrmpro.module.auth.entity.UserPrincipal;
import com.hrmpro.module.employee.entity.Employee;
import com.hrmpro.module.payroll.dto.*;
import com.hrmpro.module.payroll.entity.EmployeeAllowance;
import com.hrmpro.module.payroll.entity.PayrollRun;
import com.hrmpro.module.payroll.entity.Payslip;
import com.hrmpro.module.payroll.entity.SalaryConfig;
import com.hrmpro.module.payroll.service.PayrollService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.InputStreamResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.io.ByteArrayInputStream;
import java.math.BigDecimal;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/payroll")
@RequiredArgsConstructor
public class PayrollController {

    private final PayrollService payrollService;

    // ─── SALARY CONFIGS API ───────────────────────────────────────────────────────

    @GetMapping("/configs")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<List<SalaryConfigDto>>> getConfigs() {
        List<SalaryConfigDto> list = payrollService.getAllSalaryConfigs().stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
        return ResponseEntity.ok(ApiResponse.ok(list));
    }

    @GetMapping("/configs/active")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'HR_ADMIN')")
    public ResponseEntity<ApiResponse<SalaryConfigDto>> getActiveConfig() {
        SalaryConfigDto dto = convertToDto(payrollService.getActiveSalaryConfig());
        return ResponseEntity.ok(ApiResponse.ok(dto));
    }

    @PostMapping("/configs")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<SalaryConfigDto>> createConfig(@Valid @RequestBody SalaryConfigDto dto) {
        SalaryConfig entity = convertToEntity(dto);
        SalaryConfig created = payrollService.createSalaryConfig(entity);
        return ResponseEntity.ok(ApiResponse.ok(convertToDto(created)));
    }

    @PutMapping("/configs/{id}")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<SalaryConfigDto>> updateConfig(@PathVariable Long id, @Valid @RequestBody SalaryConfigDto dto) {
        SalaryConfig entity = convertToEntity(dto);
        SalaryConfig updated = payrollService.updateSalaryConfig(id, entity);
        return ResponseEntity.ok(ApiResponse.ok(convertToDto(updated)));
    }

    // ─── ALLOWANCES API ───────────────────────────────────────────────────────────

    @GetMapping("/allowances")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'HR_ADMIN', 'HR_STAFF')")
    public ResponseEntity<ApiResponse<List<EmployeeAllowanceDto>>> getAllowances(@RequestParam Long employeeId) {
        List<EmployeeAllowanceDto> list = payrollService.getAllowancesByEmployee(employeeId).stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
        return ResponseEntity.ok(ApiResponse.ok(list));
    }

    @PostMapping("/allowances")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'HR_ADMIN')")
    public ResponseEntity<ApiResponse<EmployeeAllowanceDto>> createAllowance(@Valid @RequestBody EmployeeAllowanceDto dto) {
        EmployeeAllowance entity = convertToEntity(dto);
        EmployeeAllowance created = payrollService.createAllowance(entity);
        return ResponseEntity.ok(ApiResponse.ok(convertToDto(created)));
    }

    @PutMapping("/allowances/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'HR_ADMIN')")
    public ResponseEntity<ApiResponse<EmployeeAllowanceDto>> updateAllowance(@PathVariable Long id, @Valid @RequestBody EmployeeAllowanceDto dto) {
        EmployeeAllowance entity = convertToEntity(dto);
        EmployeeAllowance updated = payrollService.updateAllowance(id, entity);
        return ResponseEntity.ok(ApiResponse.ok(convertToDto(updated)));
    }

    @DeleteMapping("/allowances/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'HR_ADMIN')")
    public ResponseEntity<ApiResponse<Void>> deleteAllowance(@PathVariable Long id) {
        payrollService.deleteAllowance(id);
        return ResponseEntity.ok(ApiResponse.ok(null));
    }

    // ─── PAYROLL RUNS API ─────────────────────────────────────────────────────────

    @GetMapping("/runs")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'HR_ADMIN', 'HR_STAFF')")
    public ResponseEntity<ApiResponse<List<PayrollRunDto>>> getPayrollRuns() {
        List<PayrollRunDto> list = payrollService.getAllPayrollRuns().stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
        return ResponseEntity.ok(ApiResponse.ok(list));
    }

    @GetMapping("/runs/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'HR_ADMIN', 'HR_STAFF')")
    public ResponseEntity<ApiResponse<PayrollRunDto>> getPayrollRun(@PathVariable Long id) {
        PayrollRunDto dto = convertToDto(payrollService.getPayrollRun(id));
        return ResponseEntity.ok(ApiResponse.ok(dto));
    }

    @PostMapping("/runs")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'HR_ADMIN')")
    public ResponseEntity<ApiResponse<PayrollRunDto>> createPayrollRun(
            @Valid @RequestBody PayrollRunCreateDto createDto,
            @AuthenticationPrincipal UserPrincipal principal) {
        Employee runBy = Employee.builder().id(principal.getEmployeeId()).build();
        PayrollRun created = payrollService.createPayrollRun(createDto.getYear(), createDto.getMonth(), createDto.getNotes(), runBy);
        return ResponseEntity.ok(ApiResponse.ok(convertToDto(created)));
    }

    @PostMapping("/runs/{id}/calculate")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'HR_ADMIN')")
    public ResponseEntity<ApiResponse<Void>> recalculateRun(@PathVariable Long id) {
        PayrollRun run = payrollService.getPayrollRun(id);
        payrollService.calculatePayrollForRun(run);
        return ResponseEntity.ok(ApiResponse.ok(null));
    }

    @PutMapping("/runs/{id}/status")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'HR_ADMIN')")
    public ResponseEntity<ApiResponse<PayrollRunDto>> updateRunStatus(@PathVariable Long id, @RequestParam String status) {
        PayrollRun updated = payrollService.updatePayrollRunStatus(id, status);
        return ResponseEntity.ok(ApiResponse.ok(convertToDto(updated)));
    }

    @GetMapping("/runs/{id}/payslips")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'HR_ADMIN', 'HR_STAFF')")
    public ResponseEntity<ApiResponse<List<PayslipResponseDto>>> getPayslips(@PathVariable Long id) {
        List<PayslipResponseDto> list = payrollService.getPayslipsByRun(id).stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
        return ResponseEntity.ok(ApiResponse.ok(list));
    }

    @PutMapping("/payslips/{id}/deductions")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'HR_ADMIN')")
    public ResponseEntity<ApiResponse<PayslipResponseDto>> updatePayslipDeductions(@PathVariable Long id, @RequestParam BigDecimal amount) {
        Payslip updated = payrollService.updatePayslipDeductions(id, amount);
        return ResponseEntity.ok(ApiResponse.ok(convertToDto(updated)));
    }

    // ─── INDIVIDUAL PAYSLIPS API ──────────────────────────────────────────────────

    @GetMapping("/my-payslips")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<List<PayslipResponseDto>>> getMyPayslips(@AuthenticationPrincipal UserPrincipal principal) {
        if (principal.getEmployeeId() == null) {
            return ResponseEntity.ok(ApiResponse.ok(List.of()));
        }
        List<PayslipResponseDto> list = payrollService.getPayslipsByRun(null).stream() // Lấy từ DB
                .filter(p -> p.getEmployee().getId().equals(principal.getEmployeeId()) && "PUBLISHED".equals(p.getPayrollRun().getStatus()))
                .map(this::convertToDto)
                .collect(Collectors.toList());
        return ResponseEntity.ok(ApiResponse.ok(list));
    }

    @GetMapping("/payslips/{id}/pdf")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<String>> getPayslipPdfUrl(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal principal) {
        // Kiểm tra quyền: Chỉ cho phép HR/Admin hoặc chính nhân viên sở hữu phiếu lương xem
        Payslip payslip = payrollService.getPayslipsByRun(null).stream()
                .filter(p -> p.getId().equals(id))
                .findFirst()
                .orElseThrow(() -> new RuntimeException("Không tìm thấy phiếu lương ID: " + id));

        boolean isHR = principal.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_SUPER_ADMIN") || a.getAuthority().equals("ROLE_HR_ADMIN"));
        
        if (!isHR && !payslip.getEmployee().getId().equals(principal.getEmployeeId())) {
            return ResponseEntity.status(403).body(ApiResponse.error("Bạn không có quyền xem phiếu lương này."));
        }

        String downloadUrl = payrollService.getPayslipDownloadUrl(id);
        return ResponseEntity.ok(ApiResponse.ok(downloadUrl));
    }

    @GetMapping("/runs/{id}/export-bank")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'HR_ADMIN')")
    public ResponseEntity<InputStreamResource> exportBankList(@PathVariable Long id) {
        ByteArrayInputStream in = payrollService.exportBankList(id);
        HttpHeaders headers = new HttpHeaders();
        headers.add("Content-Disposition", "attachment; filename=danh-sach-chuyen-khoan.xlsx");

        return ResponseEntity.ok()
                .headers(headers)
                .contentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                .body(new InputStreamResource(in));
    }

    // ─── CONVERTERS ───────────────────────────────────────────────────────────────

    private SalaryConfigDto convertToDto(SalaryConfig entity) {
        return SalaryConfigDto.builder()
                .id(entity.getId())
                .effectiveDate(entity.getEffectiveDate())
                .minWage(entity.getMinWage())
                .socialInsuranceRate(entity.getSocialInsuranceRate())
                .healthInsuranceRate(entity.getHealthInsuranceRate())
                .unemploymentRate(entity.getUnemploymentRate())
                .personalDeduction(entity.getPersonalDeduction())
                .dependentDeduction(entity.getDependentDeduction())
                .isActive(entity.getIsActive())
                .build();
    }

    private SalaryConfig convertToEntity(SalaryConfigDto dto) {
        return SalaryConfig.builder()
                .id(dto.getId())
                .effectiveDate(dto.getEffectiveDate())
                .minWage(dto.getMinWage())
                .socialInsuranceRate(dto.getSocialInsuranceRate())
                .healthInsuranceRate(dto.getHealthInsuranceRate())
                .unemploymentRate(dto.getUnemploymentRate())
                .personalDeduction(dto.getPersonalDeduction())
                .dependentDeduction(dto.getDependentDeduction())
                .isActive(dto.getIsActive())
                .build();
    }

    private EmployeeAllowanceDto convertToDto(EmployeeAllowance entity) {
        return EmployeeAllowanceDto.builder()
                .id(entity.getId())
                .employeeId(entity.getEmployee().getId())
                .employeeName(entity.getEmployee().getFullName())
                .employeeCode(entity.getEmployee().getEmployeeCode())
                .allowanceType(entity.getAllowanceType())
                .amount(entity.getAmount())
                .isTaxable(entity.getIsTaxable())
                .effectiveDate(entity.getEffectiveDate())
                .endDate(entity.getEndDate())
                .build();
    }

    private EmployeeAllowance convertToEntity(EmployeeAllowanceDto dto) {
        return EmployeeAllowance.builder()
                .id(dto.getId())
                .employee(Employee.builder().id(dto.getEmployeeId()).build())
                .allowanceType(dto.getAllowanceType())
                .amount(dto.getAmount())
                .isTaxable(dto.getIsTaxable())
                .effectiveDate(dto.getEffectiveDate())
                .endDate(dto.getEndDate())
                .build();
    }

    private PayrollRunDto convertToDto(PayrollRun entity) {
        return PayrollRunDto.builder()
                .id(entity.getId())
                .year(entity.getYear())
                .month(entity.getMonth())
                .status(entity.getStatus())
                .runById(entity.getRunBy() != null ? entity.getRunBy().getId() : null)
                .runByName(entity.getRunBy() != null ? entity.getRunBy().getFullName() : null)
                .runAt(entity.getRunAt())
                .publishedAt(entity.getPublishedAt())
                .notes(entity.getNotes())
                .build();
    }

    private PayslipResponseDto convertToDto(Payslip entity) {
        return PayslipResponseDto.builder()
                .id(entity.getId())
                .payrollRunId(entity.getPayrollRun().getId())
                .year(entity.getPayrollRun().getYear())
                .month(entity.getPayrollRun().getMonth())
                .employeeId(entity.getEmployee().getId())
                .employeeCode(entity.getEmployee().getEmployeeCode())
                .employeeName(entity.getEmployee().getFullName())
                .departmentName(entity.getEmployee().getDepartment() != null ? entity.getEmployee().getDepartment().getName() : "—")
                .positionName(entity.getEmployee().getPosition() != null ? entity.getEmployee().getPosition().getName() : "—")
                .baseSalary(entity.getBaseSalary())
                .totalAllowances(entity.getTotalAllowances())
                .grossSalary(entity.getGrossSalary())
                .socialInsurance(entity.getSocialInsurance())
                .healthInsurance(entity.getHealthInsurance())
                .unemployment(entity.getUnemployment())
                .taxableIncome(entity.getTaxableIncome())
                .personalIncomeTax(entity.getPersonalIncomeTax())
                .otherDeductions(entity.getOtherDeductions())
                .netSalary(entity.getNetSalary())
                .actualWorkDays(entity.getActualWorkDays())
                .standardWorkDays(entity.getStandardWorkDays())
                .pdfUrl(entity.getPdfUrl())
                .build();
    }
}
