package com.hrmpro.module.attendance.service;

import com.hrmpro.common.dto.PageResponse;
import com.hrmpro.common.exception.AppException;
import com.hrmpro.common.exception.ResourceNotFoundException;
import com.hrmpro.module.attendance.dto.AttendanceAdjustmentRequest;
import com.hrmpro.module.attendance.dto.AttendanceLogResponse;
import com.hrmpro.module.attendance.dto.CheckInRequest;
import com.hrmpro.module.attendance.entity.AttendanceLog;
import com.hrmpro.module.attendance.repository.AttendanceLogRepository;
import com.hrmpro.module.employee.entity.Employee;
import com.hrmpro.module.employee.repository.EmployeeRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.InputStream;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class AttendanceService {

    private final AttendanceLogRepository attendanceLogRepository;
    private final EmployeeRepository employeeRepository;

    private static final LocalTime WORK_START_TIME = LocalTime.of(8, 30);
    private static final LocalTime WORK_END_TIME = LocalTime.of(17, 30);

    /**
     * Nhân viên Check-in
     */
    @Transactional
    public AttendanceLogResponse checkIn(Long employeeId, CheckInRequest request) {
        Employee employee = employeeRepository.findById(employeeId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy nhân viên"));

        LocalDate today = LocalDate.now();
        Optional<AttendanceLog> existingLog = attendanceLogRepository.findByEmployeeIdAndWorkDate(employeeId, today);

        if (existingLog.isPresent()) {
            throw new AppException("Bạn đã check-in hôm nay rồi", HttpStatus.BAD_REQUEST);
        }

        LocalDateTime now = LocalDateTime.now();
        // Kiểm tra đi muộn (Sau 8:30 sáng)
        String status = now.toLocalTime().isAfter(WORK_START_TIME) ? "LATE" : "ON_TIME";

        AttendanceLog log = AttendanceLog.builder()
                .employee(employee)
                .workDate(today)
                .checkIn(now)
                .checkInIp(request.getIpAddress())
                .checkInLocation(request.getLocation())
                .status(status)
                .note(request.getNote())
                .build();

        AttendanceLog saved = attendanceLogRepository.save(log);
        return convertToResponse(saved);
    }

    /**
     * Nhân viên Check-out
     */
    @Transactional
    public AttendanceLogResponse checkOut(Long employeeId) {
        LocalDate today = LocalDate.now();
        AttendanceLog log = attendanceLogRepository.findByEmployeeIdAndWorkDate(employeeId, today)
                .orElseThrow(() -> new ResourceNotFoundException("Bạn chưa check-in hôm nay"));

        if (log.getCheckOut() != null) {
            throw new AppException("Bạn đã check-out hôm nay rồi", HttpStatus.BAD_REQUEST);
        }

        LocalDateTime now = LocalDateTime.now();
        log.setCheckOut(now);

        // Cập nhật trạng thái về sớm nếu check-out trước 17:30
        if (now.toLocalTime().isBefore(WORK_END_TIME)) {
            log.setStatus("EARLY_LEAVE");
        }

        AttendanceLog saved = attendanceLogRepository.save(log);
        return convertToResponse(saved);
    }

    /**
     * Gửi yêu cầu điều chỉnh giờ công
     */
    @Transactional
    public AttendanceLogResponse requestAdjustment(Long employeeId, AttendanceAdjustmentRequest request) {
        Employee employee = employeeRepository.findById(employeeId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy nhân viên"));

        // Lấy hoặc tạo mới bản ghi công cho ngày yêu cầu
        AttendanceLog log = attendanceLogRepository.findByEmployeeIdAndWorkDate(employeeId, request.getWorkDate())
                .orElse(AttendanceLog.builder()
                        .employee(employee)
                        .workDate(request.getWorkDate())
                        .build());

        log.setCheckIn(request.getCheckIn());
        log.setCheckOut(request.getCheckOut());
        log.setStatus("PENDING_ADJUST");
        log.setNote(request.getNote());

        AttendanceLog saved = attendanceLogRepository.save(log);
        return convertToResponse(saved);
    }

    /**
     * Phê duyệt điều chỉnh công (Manager duyệt cho team, hoặc HR duyệt)
     */
    @Transactional
    public AttendanceLogResponse approveAdjustment(Long id, Boolean approve, Long managerId) {
        AttendanceLog logEntity = attendanceLogRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy bản ghi chấm công"));

        Employee manager = employeeRepository.findById(managerId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy quản lý phê duyệt"));

        if (approve) {
            logEntity.setStatus("ON_TIME"); // Chuyển thành đúng giờ khi được duyệt
            logEntity.setApprovedBy(manager);
            logEntity.setNote(logEntity.getNote() + " [Đã duyệt bởi " + manager.getFullName() + "]");
        } else {
            logEntity.setStatus("ABSENT"); // Hoặc từ chối duyệt
            logEntity.setNote(logEntity.getNote() + " [Từ chối bởi " + manager.getFullName() + "]");
        }

        AttendanceLog saved = attendanceLogRepository.save(logEntity);
        return convertToResponse(saved);
    }

    /**
     * Lấy danh sách logs chấm công
     */
    @Transactional(readOnly = true)
    public PageResponse<AttendanceLogResponse> getAttendanceLogs(
            Long employeeId, LocalDate startDate, LocalDate endDate, String status,
            Long managerId, Long departmentId, Pageable pageable
    ) {
        Page<AttendanceLog> page = attendanceLogRepository.findAttendanceLogsWithFilters(
                employeeId, startDate, endDate, status, managerId, departmentId, pageable
        );

        List<AttendanceLogResponse> content = page.getContent().stream()
                .map(this::convertToResponse)
                .collect(Collectors.toList());

        return new PageResponse<>(
                content,
                page.getNumber(),
                page.getSize(),
                page.getTotalElements(),
                page.getTotalPages()
        );
    }

    /**
     * Import Excel chấm công
     */
    @Transactional
    public void importAttendanceExcel(MultipartFile file) {
        try (InputStream is = file.getInputStream(); Workbook workbook = new XSSFWorkbook(is)) {
            Sheet sheet = workbook.getSheetAt(0);
            List<AttendanceLog> logsToSave = new ArrayList<>();

            for (int i = 1; i <= sheet.getLastRowNum(); i++) {
                Row row = sheet.getRow(i);
                if (row == null) continue;

                Cell codeCell = row.getCell(0); // Mã nhân viên
                Cell dateCell = row.getCell(1); // Ngày (yyyy-MM-dd)
                Cell checkInCell = row.getCell(2); // Check-in time (HH:mm:ss)
                Cell checkOutCell = row.getCell(3); // Check-out time (HH:mm:ss)

                if (codeCell == null || dateCell == null) continue;

                String empCode = codeCell.getStringCellValue();
                LocalDate workDate = LocalDate.parse(dateCell.getStringCellValue(), DateTimeFormatter.ISO_LOCAL_DATE);

                Optional<Employee> employeeOpt = employeeRepository.findByEmployeeCode(empCode);
                if (employeeOpt.isEmpty()) continue; // Bỏ qua nếu không tìm thấy nhân viên

                Employee employee = employeeOpt.get();
                
                LocalDateTime checkIn = null;
                if (checkInCell != null && !"".equals(checkInCell.getStringCellValue())) {
                    LocalTime time = LocalTime.parse(checkInCell.getStringCellValue(), DateTimeFormatter.ofPattern("HH:mm:ss"));
                    checkIn = LocalDateTime.of(workDate, time);
                }

                LocalDateTime checkOut = null;
                if (checkOutCell != null && !"".equals(checkOutCell.getStringCellValue())) {
                    LocalTime time = LocalTime.parse(checkOutCell.getStringCellValue(), DateTimeFormatter.ofPattern("HH:mm:ss"));
                    checkOut = LocalDateTime.of(workDate, time);
                }

                // Tính toán status mặc định
                String status = "ON_TIME";
                if (checkIn != null && checkIn.toLocalTime().isAfter(WORK_START_TIME)) {
                    status = "LATE";
                }
                if (checkOut != null && checkOut.toLocalTime().isBefore(WORK_END_TIME)) {
                    status = "EARLY_LEAVE";
                }
                if (checkIn == null && checkOut == null) {
                    status = "ABSENT";
                }

                AttendanceLog logEntity = attendanceLogRepository.findByEmployeeIdAndWorkDate(employee.getId(), workDate)
                        .orElse(AttendanceLog.builder()
                                .employee(employee)
                                .workDate(workDate)
                                .build());

                logEntity.setCheckIn(checkIn);
                logEntity.setCheckOut(checkOut);
                logEntity.setStatus(status);
                logEntity.setNote("Import từ file Excel máy chấm công");

                logsToSave.add(logEntity);
            }

            attendanceLogRepository.saveAll(logsToSave);
            log.info("Đã import thành công {} bản ghi chấm công từ Excel", logsToSave.size());
        } catch (Exception e) {
            log.error("Lỗi khi import excel chấm công: {}", e.getMessage());
            throw new AppException("Lỗi khi xử lý file Excel: " + e.getMessage(), HttpStatus.BAD_REQUEST);
        }
    }

    private AttendanceLogResponse convertToResponse(AttendanceLog entity) {
        Long approvedById = null;
        String approvedByName = null;
        if (entity.getApprovedBy() != null) {
            approvedById = entity.getApprovedBy().getId();
            approvedByName = entity.getApprovedBy().getFullName();
        }

        Long departmentId = null;
        String departmentName = null;
        if (entity.getEmployee().getDepartment() != null) {
            departmentId = entity.getEmployee().getDepartment().getId();
            departmentName = entity.getEmployee().getDepartment().getName();
        }

        return AttendanceLogResponse.builder()
                .id(entity.getId())
                .employeeId(entity.getEmployee().getId())
                .employeeCode(entity.getEmployee().getEmployeeCode())
                .employeeName(entity.getEmployee().getFullName())
                .workDate(entity.getWorkDate())
                .checkIn(entity.getCheckIn())
                .checkOut(entity.getCheckOut())
                .checkInIp(entity.getCheckInIp())
                .checkInLocation(entity.getCheckInLocation())
                .status(entity.getStatus())
                .note(entity.getNote())
                .departmentId(departmentId)
                .departmentName(departmentName)
                .approvedById(approvedById)
                .approvedByName(approvedByName)
                .build();
    }
}
