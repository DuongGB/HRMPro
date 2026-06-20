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
import com.lowagie.text.*;
import com.lowagie.text.pdf.BaseFont;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfWriter;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.CellStyle;
import org.apache.poi.ss.usermodel.DataFormat;
import org.apache.poi.ss.usermodel.IndexedColors;
import org.apache.poi.ss.usermodel.FillPatternType;
import org.apache.poi.ss.usermodel.HorizontalAlignment;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class PayrollService {

    private final SalaryConfigRepository salaryConfigRepository;
    private final EmployeeAllowanceRepository employeeAllowanceRepository;
    private final PayrollRunRepository payrollRunRepository;
    private final PayslipRepository payslipRepository;
    private final EmployeeRepository employeeRepository;
    private final ContractRepository contractRepository;
    private final AttendanceSummaryRepository attendanceSummaryRepository;
    private final MinioService minioService;

    @Value("${app.minio.bucket.payslips:hrmpro-payslips}")
    private String payslipBucket;

    // Lương cơ sở Việt Nam từ 01/07/2024
    private static final BigDecimal BASE_GOVERNMENT_WAGE = BigDecimal.valueOf(2340000);
    // Trần đóng BHXH & BHYT = 20 lần Lương cơ sở
    private static final BigDecimal INSURANCE_CEILING_BASE = BASE_GOVERNMENT_WAGE.multiply(BigDecimal.valueOf(20));

    // ─── SALARY CONFIG LOGIC ──────────────────────────────────────────────────────

    public List<SalaryConfig> getAllSalaryConfigs() {
        return salaryConfigRepository.findAllByOrderByEffectiveDateDesc();
    }

    public SalaryConfig getActiveSalaryConfig() {
        return salaryConfigRepository.findFirstByIsActiveTrueOrderByEffectiveDateDesc()
                .orElseThrow(() -> new RuntimeException("Chưa cấu hình thông số lương gốc hoạt động (Salary Config)."));
    }

    @Transactional
    public SalaryConfig createSalaryConfig(SalaryConfig config) {
        if (Boolean.TRUE.equals(config.getIsActive())) {
            // Tắt các active config cũ
            salaryConfigRepository.findAll().forEach(c -> {
                if (Boolean.TRUE.equals(c.getIsActive())) {
                    c.setIsActive(false);
                    salaryConfigRepository.save(c);
                }
            });
        }
        config.setCreatedAt(LocalDateTime.now());
        return salaryConfigRepository.save(config);
    }

    @Transactional
    public SalaryConfig updateSalaryConfig(Long id, SalaryConfig configData) {
        SalaryConfig config = salaryConfigRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy cấu hình lương ID: " + id));

        config.setEffectiveDate(configData.getEffectiveDate());
        config.setMinWage(configData.getMinWage());
        config.setSocialInsuranceRate(configData.getSocialInsuranceRate());
        config.setHealthInsuranceRate(configData.getHealthInsuranceRate());
        config.setUnemploymentRate(configData.getUnemploymentRate());
        config.setPersonalDeduction(configData.getPersonalDeduction());
        config.setDependentDeduction(configData.getDependentDeduction());

        if (configData.getIsActive() != null && configData.getIsActive() != config.getIsActive()) {
            config.setIsActive(configData.getIsActive());
            if (Boolean.TRUE.equals(configData.getIsActive())) {
                salaryConfigRepository.findAll().forEach(c -> {
                    if (!c.getId().equals(id) && Boolean.TRUE.equals(c.getIsActive())) {
                        c.setIsActive(false);
                        salaryConfigRepository.save(c);
                    }
                });
            }
        }

        return salaryConfigRepository.save(config);
    }

    // ─── EMPLOYEE ALLOWANCE LOGIC ─────────────────────────────────────────────────

    public List<EmployeeAllowance> getAllowancesByEmployee(Long employeeId) {
        return employeeAllowanceRepository.findByEmployeeId(employeeId);
    }

    @Transactional
    public EmployeeAllowance createAllowance(EmployeeAllowance allowance) {
        Employee emp = employeeRepository.findById(allowance.getEmployee().getId())
                .orElseThrow(() -> new RuntimeException("Không tìm thấy nhân viên ID: " + allowance.getEmployee().getId()));
        allowance.setEmployee(emp);
        return employeeAllowanceRepository.save(allowance);
    }

    @Transactional
    public EmployeeAllowance updateAllowance(Long id, EmployeeAllowance data) {
        EmployeeAllowance allowance = employeeAllowanceRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy phụ cấp ID: " + id));

        allowance.setAllowanceType(data.getAllowanceType());
        allowance.setAmount(data.getAmount());
        allowance.setIsTaxable(data.getIsTaxable());
        allowance.setEffectiveDate(data.getEffectiveDate());
        allowance.setEndDate(data.getEndDate());

        return employeeAllowanceRepository.save(allowance);
    }

    @Transactional
    public void deleteAllowance(Long id) {
        employeeAllowanceRepository.deleteById(id);
    }

    // ─── PAYROLL RUN LOGIC ────────────────────────────────────────────────────────

    public List<PayrollRun> getAllPayrollRuns() {
        return payrollRunRepository.findAllByOrderByYearDescMonthDesc();
    }

    public PayrollRun getPayrollRun(Long id) {
        return payrollRunRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy kỳ chạy lương ID: " + id));
    }

    public List<Payslip> getPayslipsByRun(Long runId) {
        return payslipRepository.findByPayrollRunId(runId);
    }

    @Transactional
    public PayrollRun createPayrollRun(Integer year, Integer month, String notes, Employee runBy) {
        if (payrollRunRepository.existsByYearAndMonth(year, month)) {
            throw new RuntimeException("Kỳ chạy lương " + month + "/" + year + " đã tồn tại.");
        }

        PayrollRun run = PayrollRun.builder()
                .year(year)
                .month(month)
                .notes(notes)
                .status("DRAFT")
                .runBy(runBy)
                .runAt(LocalDateTime.now())
                .build();

        run = payrollRunRepository.save(run);

        // Chạy tính toán lương ban đầu
        calculatePayrollForRun(run);

        return run;
    }

    @Transactional
    public void calculatePayrollForRun(PayrollRun run) {
        // Xóa bảng lương cũ của kỳ này nếu có trạng thái nháp
        if (!"DRAFT".equals(run.getStatus()) && !"PROCESSING".equals(run.getStatus())) {
            throw new RuntimeException("Chỉ được tính toán lại bảng lương khi kỳ lương ở trạng thái nháp (DRAFT/PROCESSING).");
        }

        payslipRepository.deleteByPayrollRunId(run.getId());

        // Lấy cấu hình lương gốc active
        SalaryConfig config = getActiveSalaryConfig();

        // Lấy tất cả nhân viên đang hoạt động hoặc nghỉ việc trong tháng kỳ lương
        List<Employee> employees = employeeRepository.findAll();

        LocalDate startPeriod = LocalDate.of(run.getYear(), run.getMonth(), 1);
        LocalDate endPeriod = startPeriod.plusMonths(1).minusDays(1);

        for (Employee emp : employees) {
            // Bỏ qua nhân viên đã thôi việc trước kỳ lương
            if ("TERMINATED".equals(emp.getStatus()) && emp.getTerminationDate() != null && emp.getTerminationDate().isBefore(startPeriod)) {
                continue;
            }

            // Tìm hợp đồng của nhân viên có hiệu lực trong kỳ lương
            List<Contract> contracts = contractRepository.findByEmployeeId(emp.getId());
            Optional<Contract> activeContractOpt = contracts.stream()
                    .filter(c -> !c.getStartDate().isAfter(endPeriod) && (c.getEndDate() == null || !c.getEndDate().isBefore(startPeriod)))
                    .sorted((c1, c2) -> c2.getStartDate().compareTo(c1.getStartDate())) // Lấy hợp đồng hiệu lực mới nhất
                    .findFirst();

            BigDecimal baseSalary = BigDecimal.ZERO;
            if (activeContractOpt.isPresent()) {
                baseSalary = activeContractOpt.get().getBaseSalary();
            } else {
                // Nếu không có hợp đồng có hiệu lực, bỏ qua không tính lương hoặc mặc định base = 0
                log.warn("Nhân viên {} không có hợp đồng lao động hiệu lực trong tháng {}/{}", emp.getFullName(), run.getMonth(), run.getYear());
            }

            // Tìm số ngày công thực tế từ Attendance Summary
            Optional<AttendanceSummary> summaryOpt = attendanceSummaryRepository.findByEmployeeIdAndYearAndMonth(emp.getId(), run.getYear(), run.getMonth());
            BigDecimal standardDays = BigDecimal.valueOf(22);
            BigDecimal actualDays = BigDecimal.valueOf(22);
            if (summaryOpt.isPresent()) {
                standardDays = summaryOpt.get().getWorkDays() != null ? summaryOpt.get().getWorkDays() : BigDecimal.valueOf(22);
                actualDays = summaryOpt.get().getActualDays() != null ? summaryOpt.get().getActualDays() : BigDecimal.valueOf(22);
            }

            // Lương cơ bản tính theo công thực tế
            BigDecimal proratedBase = BigDecimal.ZERO;
            if (standardDays.compareTo(BigDecimal.ZERO) > 0) {
                proratedBase = baseSalary.multiply(actualDays).divide(standardDays, 2, RoundingMode.HALF_UP);
            }

            // Tính các khoản phụ cấp của nhân viên có hiệu lực trong kỳ
            List<EmployeeAllowance> allowances = employeeAllowanceRepository.findActiveAllowances(emp.getId(), startPeriod, endPeriod);
            BigDecimal totalAllowances = BigDecimal.ZERO;
            BigDecimal nonTaxableAllowances = BigDecimal.ZERO;

            for (EmployeeAllowance allowance : allowances) {
                totalAllowances = totalAllowances.add(allowance.getAmount());
                if (Boolean.FALSE.equals(allowance.getIsTaxable())) {
                    nonTaxableAllowances = nonTaxableAllowances.add(allowance.getAmount());
                }
            }

            // Lương Gross
            BigDecimal grossSalary = proratedBase.add(totalAllowances);

            // Tính bảo hiểm xã hội bắt buộc (tính trên prorated base)
            // Trần bảo hiểm xã hội và y tế
            BigDecimal insBaseBHXH_BHYT = proratedBase.min(INSURANCE_CEILING_BASE);
            BigDecimal socialInsurance = insBaseBHXH_BHYT.multiply(config.getSocialInsuranceRate().divide(BigDecimal.valueOf(100), 4, RoundingMode.HALF_UP));
            BigDecimal healthInsurance = insBaseBHXH_BHYT.multiply(config.getHealthInsuranceRate().divide(BigDecimal.valueOf(100), 4, RoundingMode.HALF_UP));

            // Trần bảo hiểm thất nghiệp = 20 lần Lương tối thiểu vùng
            BigDecimal trầnBHTN = config.getMinWage() != null ? config.getMinWage().multiply(BigDecimal.valueOf(20)) : BigDecimal.valueOf(99200000);
            BigDecimal insBaseBHTN = proratedBase.min(trầnBHTN);
            BigDecimal unemployment = insBaseBHTN.multiply(config.getUnemploymentRate().divide(BigDecimal.valueOf(100), 4, RoundingMode.HALF_UP));

            BigDecimal totalInsurance = socialInsurance.add(healthInsurance).add(unemployment);

            // Thu nhập chịu thuế TNCN = Gross Salary - Phụ cấp miễn thuế
            BigDecimal taxableIncome = grossSalary.subtract(nonTaxableAllowances);

            // Giảm trừ gia cảnh: Bản thân + Người phụ thuộc
            BigDecimal personalDeduction = config.getPersonalDeduction();
            BigDecimal dependentDeduction = BigDecimal.ZERO; // Mặc định 0 do chưa quản lý dependent_count

            // Thu nhập tính thuế TNCN
            BigDecimal assessedIncome = taxableIncome
                    .subtract(personalDeduction)
                    .subtract(dependentDeduction)
                    .subtract(totalInsurance)
                    .max(BigDecimal.ZERO);

            // Tính thuế TNCN lũy tiến từng phần theo biểu Việt Nam
            BigDecimal personalIncomeTax = calculatePIT(assessedIncome);

            // Thực nhận (Net Salary) ban đầu (khấu trừ khác = 0, cho phép HR sửa tay)
            BigDecimal netSalary = grossSalary.subtract(totalInsurance).subtract(personalIncomeTax).max(BigDecimal.ZERO);

            Payslip payslip = Payslip.builder()
                    .payrollRun(run)
                    .employee(emp)
                    .baseSalary(baseSalary)
                    .totalAllowances(totalAllowances)
                    .grossSalary(grossSalary)
                    .socialInsurance(socialInsurance.setScale(0, RoundingMode.HALF_UP))
                    .healthInsurance(healthInsurance.setScale(0, RoundingMode.HALF_UP))
                    .unemployment(unemployment.setScale(0, RoundingMode.HALF_UP))
                    .taxableIncome(taxableIncome)
                    .personalIncomeTax(personalIncomeTax)
                    .otherDeductions(BigDecimal.ZERO)
                    .netSalary(netSalary.setScale(0, RoundingMode.HALF_UP))
                    .standardWorkDays(standardDays)
                    .actualWorkDays(actualDays)
                    .build();

            payslipRepository.save(payslip);
        }
    }

    /**
     * Tính thuế TNCN theo biểu thuế lũy tiến từng phần Việt Nam
     */
    private BigDecimal calculatePIT(BigDecimal assessedIncome) {
        if (assessedIncome.compareTo(BigDecimal.ZERO) <= 0) {
            return BigDecimal.ZERO;
        }

        double income = assessedIncome.doubleValue();
        double tax = 0;

        // Bậc 1: <= 5M (5%)
        if (income <= 5000000) {
            tax = income * 0.05;
        }
        // Bậc 2: > 5M đến 10M (10%)
        else if (income <= 10000000) {
            tax = 5000000 * 0.05 + (income - 5000000) * 0.10;
        }
        // Bậc 3: > 10M đến 18M (15%)
        else if (income <= 18000000) {
            tax = 5000000 * 0.05 + 5000000 * 0.10 + (income - 10000000) * 0.15;
        }
        // Bậc 4: > 18M đến 32M (20%)
        else if (income <= 32000000) {
            tax = 5000000 * 0.05 + 5000000 * 0.10 + 8000000 * 0.15 + (income - 18000000) * 0.20;
        }
        // Bậc 5: > 32M đến 52M (25%)
        else if (income <= 52000000) {
            tax = 5000000 * 0.05 + 5000000 * 0.10 + 8000000 * 0.15 + 14000000 * 0.20 + (income - 32000000) * 0.25;
        }
        // Bậc 6: > 52M đến 80M (30%)
        else if (income <= 80000000) {
            tax = 5000000 * 0.05 + 5000000 * 0.10 + 8000000 * 0.15 + 14000000 * 0.20 + 20000000 * 0.25 + (income - 52000000) * 0.30;
        }
        // Bậc 7: > 80M (35%)
        else {
            tax = 5000000 * 0.05 + 5000000 * 0.10 + 8000000 * 0.15 + 14000000 * 0.20 + 20000000 * 0.25 + 28000000 * 0.30 + (income - 80000000) * 0.35;
        }

        return BigDecimal.valueOf(tax).setScale(0, RoundingMode.HALF_UP);
    }

    @Transactional
    public Payslip updatePayslipDeductions(Long payslipId, BigDecimal otherDeductions) {
        Payslip payslip = payslipRepository.findById(payslipId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy phiếu lương ID: " + payslipId));

        if (!"DRAFT".equals(payslip.getPayrollRun().getStatus()) && !"PROCESSING".equals(payslip.getPayrollRun().getStatus())) {
            throw new RuntimeException("Chỉ được chỉnh sửa khấu trừ khi kỳ lương ở trạng thái nháp.");
        }

        payslip.setOtherDeductions(otherDeductions);

        // Tính toán lại lương thực nhận Net
        BigDecimal totalInsurance = payslip.getSocialInsurance().add(payslip.getHealthInsurance()).add(payslip.getUnemployment());
        BigDecimal netSalary = payslip.getGrossSalary()
                .subtract(totalInsurance)
                .subtract(payslip.getPersonalIncomeTax())
                .subtract(otherDeductions)
                .max(BigDecimal.ZERO);

        payslip.setNetSalary(netSalary.setScale(0, RoundingMode.HALF_UP));

        return payslipRepository.save(payslip);
    }

    @Transactional
    public PayrollRun updatePayrollRunStatus(Long id, String status) {
        PayrollRun run = getPayrollRun(id);

        if ("PUBLISHED".equals(status)) {
            run.setPublishedAt(LocalDateTime.now());
            // Sinh PDF phiếu lương cho tất cả nhân viên và tải lên MinIO
            generateAndUploadAllPayslips(run);
        } else if ("COMPLETED".equals(status)) {
            run.setStatus("COMPLETED");
        }

        run.setStatus(status);
        return payrollRunRepository.save(run);
    }

    // ─── PDF GENERATION & STORAGE LOGIC ───────────────────────────────────────────

    private void generateAndUploadAllPayslips(PayrollRun run) {
        List<Payslip> payslips = payslipRepository.findByPayrollRunId(run.getId());
        for (Payslip payslip : payslips) {
            try {
                ByteArrayInputStream pdfStream = generatePayslipPdfStream(payslip);
                String objectKey = String.format("payroll/%d%02d/payslip-emp-%s.pdf",
                        run.getYear(), run.getMonth(), payslip.getEmployee().getEmployeeCode());

                minioService.uploadFile(payslipBucket, objectKey, pdfStream, "application/pdf");
                
                payslip.setPdfUrl(objectKey);
                payslipRepository.save(payslip);
            } catch (Exception e) {
                log.error("Lỗi khi sinh/upload PDF phiếu lương cho nhân viên {}: {}",
                        payslip.getEmployee().getFullName(), e.getMessage());
            }
        }
    }

    public String getPayslipDownloadUrl(Long payslipId) {
        Payslip payslip = payslipRepository.findById(payslipId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy phiếu lương ID: " + payslipId));

        if (payslip.getPdfUrl() == null) {
            // Nếu chưa có PDF, tiến hành sinh và upload trực tiếp
            try {
                ByteArrayInputStream pdfStream = generatePayslipPdfStream(payslip);
                String objectKey = String.format("payroll/%d%02d/payslip-emp-%s.pdf",
                        payslip.getPayrollRun().getYear(), payslip.getPayrollRun().getMonth(),
                        payslip.getEmployee().getEmployeeCode());
                minioService.uploadFile(payslipBucket, objectKey, pdfStream, "application/pdf");
                payslip.setPdfUrl(objectKey);
                payslipRepository.save(payslip);
            } catch (Exception e) {
                throw new RuntimeException("Không thể tự động tạo file PDF phiếu lương: " + e.getMessage(), e);
            }
        }

        return minioService.getPresignedUrl(payslipBucket, payslip.getPdfUrl(), 15);
    }

    public ByteArrayInputStream generatePayslipPdfStream(Payslip payslip) throws Exception {
        Document document = new Document(PageSize.A4, 36, 36, 36, 36);
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        PdfWriter.getInstance(document, out);
        document.open();

        // Đăng ký font tiếng Việt (Arial của Windows)
        BaseFont bf;
        try {
            bf = BaseFont.createFont("C:\\Windows\\Fonts\\arial.ttf", BaseFont.IDENTITY_H, BaseFont.EMBEDDED);
        } catch (Exception e) {
            // Fallback nếu không tìm thấy font arial.ttf (ở máy phi-windows hoặc môi trường Docker)
            bf = BaseFont.createFont(BaseFont.HELVETICA, BaseFont.CP1252, BaseFont.NOT_EMBEDDED);
        }

        Font fontTitle = new Font(bf, 16, Font.BOLD, java.awt.Color.BLACK);
        Font fontSubtitle = new Font(bf, 10, Font.ITALIC, java.awt.Color.GRAY);
        Font fontHeader = new Font(bf, 11, Font.BOLD, java.awt.Color.BLACK);
        Font fontBody = new Font(bf, 10, Font.NORMAL, java.awt.Color.BLACK);
        Font fontBodyBold = new Font(bf, 10, Font.BOLD, java.awt.Color.BLACK);
        Font fontTotal = new Font(bf, 11, Font.BOLD, new java.awt.Color(0, 102, 204));

        // Title
        Paragraph title = new Paragraph("PHIẾU LƯƠNG NHÂN VIÊN", fontTitle);
        title.setAlignment(Element.ALIGN_CENTER);
        document.add(title);

        Paragraph subtitle = new Paragraph("Tháng " + payslip.getPayrollRun().getMonth() + " năm " + payslip.getPayrollRun().getYear(), fontSubtitle);
        subtitle.setAlignment(Element.ALIGN_CENTER);
        subtitle.setSpacingAfter(20);
        document.add(subtitle);

        // Employee Info Table
        PdfPTable infoTable = new PdfPTable(2);
        infoTable.setWidthPercentage(100);
        infoTable.setSpacingAfter(20);

        infoTable.addCell(createCellNoBorder("Họ và tên: " + payslip.getEmployee().getFullName(), fontBody));
        infoTable.addCell(createCellNoBorder("Mã nhân viên: " + payslip.getEmployee().getEmployeeCode(), fontBody));
        infoTable.addCell(createCellNoBorder("Phòng ban: " + (payslip.getEmployee().getDepartment() != null ? payslip.getEmployee().getDepartment().getName() : "—"), fontBody));
        infoTable.addCell(createCellNoBorder("Chức danh: " + (payslip.getEmployee().getPosition() != null ? payslip.getEmployee().getPosition().getName() : "—"), fontBody));
        infoTable.addCell(createCellNoBorder("Mã số thuế: " + (payslip.getEmployee().getTaxCode() != null ? payslip.getEmployee().getTaxCode() : "—"), fontBody));
        infoTable.addCell(createCellNoBorder("Số công chuẩn / thực tế: " + payslip.getStandardWorkDays() + " / " + payslip.getActualWorkDays() + " ngày", fontBody));

        document.add(infoTable);

        // Salary Details Table
        PdfPTable table = new PdfPTable(3);
        table.setWidthPercentage(100);
        table.setWidths(new float[]{50f, 25f, 25f});
        table.setSpacingAfter(20);

        // Headers
        table.addCell(createHeaderCell("Khoản mục (Salary Items)", fontHeader));
        table.addCell(createHeaderCell("Phát sinh Cộng (+)", fontHeader));
        table.addCell(createHeaderCell("Phát sinh Trừ (-)", fontHeader));

        // Rows
        addSalaryRow(table, "Lương cơ bản (Base Salary)", formatCurrency(payslip.getBaseSalary()), "", fontBody);
        addSalaryRow(table, "Lương theo ngày công thực tế", formatCurrency(payslip.getGrossSalary().subtract(payslip.getTotalAllowances())), "", fontBody);
        addSalaryRow(table, "Tổng phụ cấp (Allowances)", formatCurrency(payslip.getTotalAllowances()), "", fontBody);
        addSalaryRow(table, "Lương Gross (Gross Salary)", formatCurrency(payslip.getGrossSalary()), "", fontBodyBold);

        addSalaryRow(table, "Bảo hiểm xã hội (Social Insurance - 8%)", "", formatCurrency(payslip.getSocialInsurance()), fontBody);
        addSalaryRow(table, "Bảo hiểm y tế (Health Insurance - 1.5%)", "", formatCurrency(payslip.getHealthInsurance()), fontBody);
        addSalaryRow(table, "Bảo hiểm thất nghiệp (Unemployment - 1%)", "", formatCurrency(payslip.getUnemployment()), fontBody);
        addSalaryRow(table, "Thuế thu nhập cá nhân (PIT)", "", formatCurrency(payslip.getPersonalIncomeTax()), fontBody);
        addSalaryRow(table, "Khấu trừ khác (Other Deductions)", "", formatCurrency(payslip.getOtherDeductions()), fontBody);

        // Net Salary
        table.addCell(createCellNoBorderBold("THỰC NHẬN (NET SALARY)", fontTotal));
        table.addCell(createCellNoBorderBold(formatCurrency(payslip.getNetSalary()), fontTotal));
        table.addCell(createCellNoBorderBold("", fontTotal));

        document.add(table);

        // Footer Signatures
        Paragraph footerNotes = new Paragraph("\n* Lưu ý: Mọi thắc mắc về phiếu lương xin liên hệ Phòng Hành chính - Nhân sự trong vòng 3 ngày làm việc kể từ khi nhận được phiếu lương.", fontSubtitle);
        document.add(footerNotes);

        document.close();
        return new ByteArrayInputStream(out.toByteArray());
    }

    private PdfPCell createHeaderCell(String text, Font font) {
        PdfPCell cell = new PdfPCell(new Phrase(text, font));
        cell.setBackgroundColor(new java.awt.Color(240, 240, 240));
        cell.setHorizontalAlignment(Element.ALIGN_CENTER);
        cell.setPadding(8);
        return cell;
    }

    private void addSalaryRow(PdfPTable table, String item, String addValue, String subValue, Font font) {
        table.addCell(new PdfPCell(new Phrase(item, font)));
        
        PdfPCell cellAdd = new PdfPCell(new Phrase(addValue, font));
        cellAdd.setHorizontalAlignment(Element.ALIGN_RIGHT);
        table.addCell(cellAdd);

        PdfPCell cellSub = new PdfPCell(new Phrase(subValue, font));
        cellSub.setHorizontalAlignment(Element.ALIGN_RIGHT);
        table.addCell(cellSub);
    }

    private PdfPCell createCellNoBorder(String text, Font font) {
        PdfPCell cell = new PdfPCell(new Phrase(text, font));
        cell.setBorder(Rectangle.NO_BORDER);
        cell.setPadding(4);
        return cell;
    }

    private PdfPCell createCellNoBorderBold(String text, Font font) {
        PdfPCell cell = new PdfPCell(new Phrase(text, font));
        cell.setBorder(Rectangle.BOTTOM);
        cell.setPadding(8);
        return cell;
    }

    private String formatCurrency(BigDecimal value) {
        if (value == null) return "0đ";
        return String.format("%,.0fđ", value);
    }

    // ─── BANK EXCEL EXPORT LOGIC ──────────────────────────────────────────────────

    public ByteArrayInputStream exportBankList(Long payrollRunId) {
        PayrollRun run = getPayrollRun(payrollRunId);
        List<Payslip> payslips = payslipRepository.findByPayrollRunId(payrollRunId);

        try (Workbook workbook = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Sheet sheet = workbook.createSheet("Danh sach chuyen khoan");

            // Style headers
            org.apache.poi.ss.usermodel.Font headerFont = workbook.createFont();
            headerFont.setBold(true);
            headerFont.setColor(IndexedColors.WHITE.getIndex());

            CellStyle headerCellStyle = workbook.createCellStyle();
            headerCellStyle.setFont(headerFont);
            headerCellStyle.setFillForegroundColor(IndexedColors.BLUE.getIndex());
            headerCellStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);
            headerCellStyle.setAlignment(HorizontalAlignment.CENTER);

            // Row 1: Title
            Row titleRow = sheet.createRow(0);
            Cell titleCell = titleRow.createCell(0);
            titleCell.setCellValue("DANH SÁCH CHUYỂN KHOẢN LƯƠNG THÁNG " + run.getMonth() + "/" + run.getYear());
            org.apache.poi.ss.usermodel.Font titleFont = workbook.createFont();
            titleFont.setBold(true);
            titleFont.setFontHeightInPoints((short) 14);
            CellStyle titleStyle = workbook.createCellStyle();
            titleStyle.setFont(titleFont);
            titleCell.setCellStyle(titleStyle);

            // Headers
            String[] headers = {"STT", "Mã nhân viên", "Họ và tên", "Số tài khoản", "Ngân hàng", "Số tiền chuyển khoản (VNĐ)", "Nội dung chuyển khoản"};
            Row headerRow = sheet.createRow(2);
            for (int i = 0; i < headers.length; i++) {
                Cell cell = headerRow.createCell(i);
                cell.setCellValue(headers[i]);
                cell.setCellStyle(headerCellStyle);
            }

            // Data Rows
            int rowIdx = 3;
            int stt = 1;
            CellStyle currencyStyle = workbook.createCellStyle();
            DataFormat format = workbook.createDataFormat();
            currencyStyle.setDataFormat(format.getFormat("#,##0"));

            for (Payslip payslip : payslips) {
                Row row = sheet.createRow(rowIdx++);

                row.createCell(0).setCellValue(stt++);
                row.createCell(1).setCellValue(payslip.getEmployee().getEmployeeCode());
                row.createCell(2).setCellValue(payslip.getEmployee().getFullName());
                
                String account = payslip.getEmployee().getBankAccountNumber() != null ? payslip.getEmployee().getBankAccountNumber() : "—";
                row.createCell(3).setCellValue(account);
                
                String bank = payslip.getEmployee().getBankName() != null ? payslip.getEmployee().getBankName() : "—";
                row.createCell(4).setCellValue(bank);

                Cell moneyCell = row.createCell(5);
                moneyCell.setCellValue(payslip.getNetSalary().doubleValue());
                moneyCell.setCellStyle(currencyStyle);

                row.createCell(6).setCellValue("Chuyen khoan luong thang " + String.format("%02d/%d", run.getMonth(), run.getYear()) + " - " + payslip.getEmployee().getFullName());
            }

            // Auto-size columns
            for (int i = 0; i < headers.length; i++) {
                sheet.autoSizeColumn(i);
            }

            workbook.write(out);
            return new ByteArrayInputStream(out.toByteArray());
        } catch (Exception e) {
            log.error("Lỗi khi xuất file Excel chuyển khoản: {}", e.getMessage());
            throw new RuntimeException("Không thể xuất file Excel chuyển khoản: " + e.getMessage());
        }
    }
}
