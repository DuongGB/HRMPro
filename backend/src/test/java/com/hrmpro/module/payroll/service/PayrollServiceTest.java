package com.hrmpro.module.payroll.service;

import com.hrmpro.common.service.MinioService;
import com.hrmpro.module.attendance.entity.AttendanceSummary;
import com.hrmpro.module.attendance.repository.AttendanceSummaryRepository;
import com.hrmpro.module.employee.entity.Contract;
import com.hrmpro.module.employee.entity.Employee;
import com.hrmpro.module.employee.repository.ContractRepository;
import com.hrmpro.module.employee.repository.EmployeeRepository;
import com.hrmpro.module.payroll.entity.EmployeeAllowance;
import com.hrmpro.module.payroll.entity.PayrollRun;
import com.hrmpro.module.payroll.entity.Payslip;
import com.hrmpro.module.payroll.entity.SalaryConfig;
import com.hrmpro.module.payroll.repository.EmployeeAllowanceRepository;
import com.hrmpro.module.payroll.repository.PayrollRunRepository;
import com.hrmpro.module.payroll.repository.PayslipRepository;
import com.hrmpro.module.payroll.repository.SalaryConfigRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.io.ByteArrayInputStream;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("PayrollService Unit Tests")
class PayrollServiceTest {

    @Mock private SalaryConfigRepository salaryConfigRepository;
    @Mock private EmployeeAllowanceRepository employeeAllowanceRepository;
    @Mock private PayrollRunRepository payrollRunRepository;
    @Mock private PayslipRepository payslipRepository;
    @Mock private EmployeeRepository employeeRepository;
    @Mock private ContractRepository contractRepository;
    @Mock private AttendanceSummaryRepository attendanceSummaryRepository;
    @Mock private MinioService minioService;

    @InjectMocks
    private PayrollService payrollService;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(payrollService, "payslipBucket", "test-payslip-bucket");
    }

    @Test
    @DisplayName("getActiveSalaryConfig — có cấu hình đang hoạt động → trả về")
    void getActiveSalaryConfig_Success() {
        SalaryConfig config = SalaryConfig.builder().id(1L).isActive(true).build();
        when(salaryConfigRepository.findFirstByIsActiveTrueOrderByEffectiveDateDesc()).thenReturn(Optional.of(config));

        SalaryConfig result = payrollService.getActiveSalaryConfig();

        assertThat(result).isNotNull();
        assertThat(result.getId()).isEqualTo(1L);
    }

    @Test
    @DisplayName("getActiveSalaryConfig — không có cấu hình → ném ngoại lệ")
    void getActiveSalaryConfig_ThrowsException() {
        when(salaryConfigRepository.findFirstByIsActiveTrueOrderByEffectiveDateDesc()).thenReturn(Optional.empty());

        assertThatThrownBy(() -> payrollService.getActiveSalaryConfig())
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("Chưa cấu hình thông số lương gốc hoạt động");
    }

    @Test
    @DisplayName("createSalaryConfig — lưu thành công và tắt các config cũ nếu active=true")
    void createSalaryConfig_DeactivatesOldConfigs() {
        SalaryConfig oldConfig = SalaryConfig.builder().id(1L).isActive(true).build();
        SalaryConfig newConfig = SalaryConfig.builder().id(2L).isActive(true).build();

        when(salaryConfigRepository.findAll()).thenReturn(List.of(oldConfig));
        when(salaryConfigRepository.save(any(SalaryConfig.class))).thenAnswer(invocation -> invocation.getArgument(0));

        SalaryConfig result = payrollService.createSalaryConfig(newConfig);

        assertThat(result.getIsActive()).isTrue();
        verify(salaryConfigRepository).save(argThat(c -> c.getId().equals(1L) && !c.getIsActive()));
    }

    @Test
    @DisplayName("createPayrollRun — tạo run mới và gọi calculatePayrollForRun")
    void createPayrollRun_Success() {
        Employee runner = Employee.builder().id(1L).firstName("HR").lastName("User").build();
        when(payrollRunRepository.existsByYearAndMonth(2026, 6)).thenReturn(false);
        when(payrollRunRepository.save(any(PayrollRun.class))).thenAnswer(i -> {
            PayrollRun r = i.getArgument(0);
            r.setId(10L);
            return r;
        });

        // Mock dependencies for calculatePayrollForRun
        SalaryConfig config = SalaryConfig.builder()
                .minWage(BigDecimal.valueOf(4000000))
                .socialInsuranceRate(BigDecimal.valueOf(8.0))
                .healthInsuranceRate(BigDecimal.valueOf(1.5))
                .unemploymentRate(BigDecimal.valueOf(1.0))
                .personalDeduction(BigDecimal.valueOf(11000000))
                .dependentDeduction(BigDecimal.ZERO)
                .isActive(true)
                .build();
        when(salaryConfigRepository.findFirstByIsActiveTrueOrderByEffectiveDateDesc()).thenReturn(Optional.of(config));
        when(employeeRepository.findAll()).thenReturn(Collections.emptyList());

        PayrollRun run = payrollService.createPayrollRun(2026, 6, "Kỳ lương tháng 6", runner);

        assertThat(run).isNotNull();
        assertThat(run.getId()).isEqualTo(10L);
        assertThat(run.getStatus()).isEqualTo("DRAFT");
        verify(payrollRunRepository).save(any(PayrollRun.class));
    }

    @Test
    @DisplayName("createPayrollRun — trùng kỳ lương → ném ngoại lệ")
    void createPayrollRun_DuplicatePeriod_ThrowsException() {
        Employee runner = Employee.builder().id(1L).build();
        when(payrollRunRepository.existsByYearAndMonth(2026, 6)).thenReturn(true);

        assertThatThrownBy(() -> payrollService.createPayrollRun(2026, 6, "Kỳ lương", runner))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("Kỳ chạy lương 6/2026 đã tồn tại");
    }

    @Test
    @DisplayName("calculatePayrollForRun — tính toán lương chuẩn cho nhân viên")
    void calculatePayrollForRun_Success() {
        PayrollRun run = PayrollRun.builder().id(10L).year(2026).month(6).status("DRAFT").build();

        SalaryConfig config = SalaryConfig.builder()
                .minWage(BigDecimal.valueOf(4680000))
                .socialInsuranceRate(BigDecimal.valueOf(8.0))
                .healthInsuranceRate(BigDecimal.valueOf(1.5))
                .unemploymentRate(BigDecimal.valueOf(1.0))
                .personalDeduction(BigDecimal.valueOf(11000000))
                .dependentDeduction(BigDecimal.ZERO)
                .isActive(true)
                .build();

        Employee emp = Employee.builder().id(1L).firstName("John").lastName("Doe").status("WORKING").build();
        Contract contract = Contract.builder()
                .id(1L)
                .baseSalary(BigDecimal.valueOf(20000000)) // 20M
                .startDate(LocalDate.of(2025, 1, 1))
                .build();

        AttendanceSummary summary = AttendanceSummary.builder()
                .id(1L)
                .workDays(BigDecimal.valueOf(22))
                .actualDays(BigDecimal.valueOf(22))
                .build();

        EmployeeAllowance allowance = EmployeeAllowance.builder()
                .amount(BigDecimal.valueOf(2000000)) // Phụ cấp 2M
                .isTaxable(false) // Phụ cấp miễn thuế
                .build();

        when(salaryConfigRepository.findFirstByIsActiveTrueOrderByEffectiveDateDesc()).thenReturn(Optional.of(config));
        when(employeeRepository.findAll()).thenReturn(List.of(emp));
        when(contractRepository.findByEmployeeId(1L)).thenReturn(List.of(contract));
        when(attendanceSummaryRepository.findByEmployeeIdAndYearAndMonth(1L, 2026, 6)).thenReturn(Optional.of(summary));
        when(employeeAllowanceRepository.findActiveAllowances(eq(1L), any(LocalDate.class), any(LocalDate.class)))
                .thenReturn(List.of(allowance));

        payrollService.calculatePayrollForRun(run);

        // Verify payslip lưu đúng Net, Gross, PIT, BH
        // Prorated base = 20M * 22 / 22 = 20M
        // Allowances = 2M. Gross = 22M.
        // BHXH = 20M * 8% = 1.6M
        // BHYT = 20M * 1.5% = 300K
        // BHTN = 20M * 1% = 200K
        // Total BH = 2.1M
        // Thu nhập chịu thuế TNCN = 22M - 2M (miễn thuế) = 20M
        // Thu nhập tính thuế TNCN = 20M - 11M (bản thân) - 2.1M (bảo hiểm) = 6.9M
        // PIT = Bậc 1 (5M * 5% = 250k) + Bậc 2 ((6.9M - 5M) * 10% = 190k) = 440k
        // Net = Gross (22M) - BH (2.1M) - PIT (440k) = 19.46M
        verify(payslipRepository).save(argThat(payslip -> {
            assertThat(payslip.getGrossSalary()).isEqualByComparingTo(BigDecimal.valueOf(22000000));
            assertThat(payslip.getSocialInsurance()).isEqualByComparingTo(BigDecimal.valueOf(1600000));
            assertThat(payslip.getHealthInsurance()).isEqualByComparingTo(BigDecimal.valueOf(300000));
            assertThat(payslip.getUnemployment()).isEqualByComparingTo(BigDecimal.valueOf(200000));
            assertThat(payslip.getPersonalIncomeTax()).isEqualByComparingTo(BigDecimal.valueOf(440000));
            assertThat(payslip.getNetSalary()).isEqualByComparingTo(BigDecimal.valueOf(19460000));
            return true;
        }));
    }

    @Test
    @DisplayName("updatePayslipDeductions — cập nhật giảm trừ khác thành công và tính lại Net")
    void updatePayslipDeductions_Success() {
        PayrollRun run = PayrollRun.builder().status("DRAFT").build();
        Payslip payslip = Payslip.builder()
                .id(1L)
                .payrollRun(run)
                .grossSalary(BigDecimal.valueOf(22000000))
                .socialInsurance(BigDecimal.valueOf(1600000))
                .healthInsurance(BigDecimal.valueOf(300000))
                .unemployment(BigDecimal.valueOf(200000))
                .personalIncomeTax(BigDecimal.valueOf(440000))
                .otherDeductions(BigDecimal.ZERO)
                .netSalary(BigDecimal.valueOf(19460000))
                .build();

        when(payslipRepository.findById(1L)).thenReturn(Optional.of(payslip));
        when(payslipRepository.save(any(Payslip.class))).thenAnswer(i -> i.getArgument(0));

        Payslip updated = payrollService.updatePayslipDeductions(1L, BigDecimal.valueOf(500000));

        assertThat(updated.getOtherDeductions()).isEqualByComparingTo(BigDecimal.valueOf(500000));
        // Net = 19.46M - 500K = 18.96M
        assertThat(updated.getNetSalary()).isEqualByComparingTo(BigDecimal.valueOf(18960000));
        verify(payslipRepository).save(updated);
    }

    @Test
    @DisplayName("updatePayrollRunStatus — chuyển sang PUBLISHED → sinh PDF và upload MinIO")
    void updatePayrollRunStatus_Published() {
        Employee emp = Employee.builder().id(1L).employeeCode("EMP001").firstName("John").lastName("Doe").build();
        PayrollRun run = PayrollRun.builder().id(10L).year(2026).month(6).status("DRAFT").build();
        Payslip payslip = Payslip.builder()
                .id(1L)
                .payrollRun(run)
                .employee(emp)
                .baseSalary(BigDecimal.valueOf(20000000))
                .grossSalary(BigDecimal.valueOf(22000000))
                .totalAllowances(BigDecimal.valueOf(200000))
                .socialInsurance(BigDecimal.valueOf(1600000))
                .healthInsurance(BigDecimal.valueOf(300000))
                .unemployment(BigDecimal.valueOf(200000))
                .personalIncomeTax(BigDecimal.valueOf(440000))
                .otherDeductions(BigDecimal.ZERO)
                .netSalary(BigDecimal.valueOf(19460000))
                .standardWorkDays(BigDecimal.valueOf(22))
                .actualWorkDays(BigDecimal.valueOf(22))
                .build();

        when(payrollRunRepository.findById(10L)).thenReturn(Optional.of(run));
        when(payslipRepository.findByPayrollRunId(10L)).thenReturn(List.of(payslip));
        when(payrollRunRepository.save(any(PayrollRun.class))).thenAnswer(i -> i.getArgument(0));

        PayrollRun updatedRun = payrollService.updatePayrollRunStatus(10L, "PUBLISHED");

        assertThat(updatedRun.getStatus()).isEqualTo("PUBLISHED");
        verify(minioService).uploadFile(eq("test-payslip-bucket"), contains("payslip-emp-EMP001.pdf"), any(), eq("application/pdf"));
        verify(payslipRepository).save(argThat(p -> p.getPdfUrl() != null && p.getPdfUrl().contains("payslip-emp-EMP001.pdf")));
    }

    @Test
    @DisplayName("getPayslipDownloadUrl — đã có PDF thì lấy presigned URL, chưa có thì sinh PDF mới")
    void getPayslipDownloadUrl_AlreadyHasPdf() {
        Employee emp = Employee.builder().id(1L).employeeCode("EMP001").build();
        PayrollRun run = PayrollRun.builder().year(2026).month(6).build();
        Payslip payslip = Payslip.builder()
                .id(1L)
                .payrollRun(run)
                .employee(emp)
                .pdfUrl("payroll/202606/payslip-emp-EMP001.pdf")
                .build();

        when(payslipRepository.findById(1L)).thenReturn(Optional.of(payslip));
        when(minioService.getPresignedUrl("test-payslip-bucket", "payroll/202606/payslip-emp-EMP001.pdf", 15))
                .thenReturn("http://presigned-url");

        String url = payrollService.getPayslipDownloadUrl(1L);

        assertThat(url).isEqualTo("http://presigned-url");
        verify(minioService, never()).uploadFile(any(), any(), any(), any());
    }

    @Test
    @DisplayName("exportBankList — xuất thành công file excel danh sách chuyển khoản")
    void exportBankList_Success() throws Exception {
        Employee emp = Employee.builder()
                .id(1L)
                .employeeCode("EMP001")
                .firstName("John")
                .lastName("Doe")
                .bankAccountNumber("123456789")
                .bankName("Vietcombank")
                .build();
        PayrollRun run = PayrollRun.builder().id(10L).year(2026).month(6).status("DRAFT").build();
        Payslip payslip = Payslip.builder()
                .id(1L)
                .payrollRun(run)
                .employee(emp)
                .netSalary(BigDecimal.valueOf(19460000))
                .build();

        when(payrollRunRepository.findById(10L)).thenReturn(Optional.of(run));
        when(payslipRepository.findByPayrollRunId(10L)).thenReturn(List.of(payslip));

        ByteArrayInputStream excelStream = payrollService.exportBankList(10L);

        assertThat(excelStream).isNotNull();
        assertThat(excelStream.available()).isGreaterThan(0);
    }
}
