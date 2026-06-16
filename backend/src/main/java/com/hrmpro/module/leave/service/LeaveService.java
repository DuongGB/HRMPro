package com.hrmpro.module.leave.service;

import java.util.Optional;
import com.hrmpro.common.dto.PageResponse;
import com.hrmpro.common.exception.AppException;
import com.hrmpro.common.exception.ResourceNotFoundException;
import com.hrmpro.common.service.MinioService;
import com.hrmpro.module.employee.entity.Employee;
import com.hrmpro.module.employee.repository.EmployeeRepository;
import com.hrmpro.module.employee.service.NotificationService;
import com.hrmpro.module.leave.dto.LeaveApprovalDto;
import com.hrmpro.module.leave.dto.LeaveBalanceResponse;
import com.hrmpro.module.leave.dto.LeaveRequestDto;
import com.hrmpro.module.leave.dto.LeaveRequestResponse;
import com.hrmpro.module.leave.entity.LeaveBalance;
import com.hrmpro.module.leave.entity.LeaveRequest;
import com.hrmpro.module.leave.entity.LeaveType;
import com.hrmpro.module.leave.repository.LeaveBalanceRepository;
import com.hrmpro.module.leave.repository.LeaveRequestRepository;
import com.hrmpro.module.leave.repository.LeaveTypeRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class LeaveService {

    /**
     * Giới hạn tối đa số ngày phép năm cho một nhân sự (theo chính sách công ty)
     */
    private static final BigDecimal MAX_ANNUAL_LEAVE_DAYS = new BigDecimal("16.0");

    private final LeaveRequestRepository leaveRequestRepository;
    private final LeaveTypeRepository leaveTypeRepository;
    private final LeaveBalanceRepository leaveBalanceRepository;
    private final EmployeeRepository employeeRepository;
    private final MinioService minioService;
    private final NotificationService notificationService;

    @Value("${app.minio.bucket.documents:hrmpro-documents}")
    private String documentBucket;

    /**
     * Lấy số dư phép của nhân viên
     */
    @Transactional
    public List<LeaveBalanceResponse> getLeaveBalances(Long employeeId, Integer year) {
        if (!employeeRepository.existsById(employeeId)) {
            throw new ResourceNotFoundException("Không tìm thấy nhân viên");
        }

        // Tự động khởi tạo số dư phép cho năm hiện tại nếu chưa có
        initializeLeaveBalancesIfNeeded(employeeId, year);

        return leaveBalanceRepository.findByEmployeeIdAndYear(employeeId, year).stream()
                .map(this::convertToBalanceResponse)
                .collect(Collectors.toList());
    }

    /**
     * Tạo đơn xin nghỉ phép
     */
    @Transactional
    public LeaveRequestResponse createLeaveRequest(Long employeeId, LeaveRequestDto request, MultipartFile file) {
        Employee employee = employeeRepository.findById(employeeId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy nhân viên"));

        LeaveType leaveType = leaveTypeRepository.findByCode(request.getLeaveTypeCode())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy loại nghỉ phép"));

        int currentYear = LocalDate.now().getYear();
        initializeLeaveBalancesIfNeeded(employeeId, currentYear);

        // Kiểm tra số dư ngày phép
        if (leaveType.getDaysPerYear() != null) {
            LeaveBalance balance = leaveBalanceRepository.findByEmployeeIdAndLeaveTypeIdAndYear(employeeId, leaveType.getId(), currentYear)
                    .orElseThrow(() -> new AppException("Chưa khởi tạo số dư phép cho loại phép này", HttpStatus.BAD_REQUEST));

            if (balance.getRemainingDays().compareTo(request.getTotalDays()) < 0) {
                throw new AppException("Số ngày nghỉ phép còn lại không đủ (Còn: " + balance.getRemainingDays() + " ngày)", HttpStatus.BAD_REQUEST);
            }

            // Tạm thời trừ vào pending_days
            balance.setPendingDays(balance.getPendingDays().add(request.getTotalDays()));
            leaveBalanceRepository.save(balance);
        }

        String attachmentUrl = null;
        if (file != null && !file.isEmpty()) {
            attachmentUrl = uploadAttachment(employee.getEmployeeCode(), file);
        }

        LeaveRequest leaveRequest = LeaveRequest.builder()
                .employee(employee)
                .leaveType(leaveType)
                .startDate(request.getStartDate())
                .endDate(request.getEndDate())
                .totalDays(request.getTotalDays())
                .reason(request.getReason())
                .status("PENDING")
                .attachmentUrl(attachmentUrl)
                .build();

        LeaveRequest saved = leaveRequestRepository.save(leaveRequest);
        log.info("Đã tạo đơn xin nghỉ phép thành công cho nhân viên: {}, loại phép: {}, số ngày: {}", 
                employee.getFullName(), leaveType.getName(), request.getTotalDays());
        return convertToResponse(saved);
    }

    /**
     * Phê duyệt đơn xin nghỉ phép (Manager duyệt)
     */
    @Transactional
    public LeaveRequestResponse approveLeaveRequest(Long id, LeaveApprovalDto approval, Long managerId) {
        LeaveRequest leaveRequest = leaveRequestRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy đơn xin nghỉ phép"));

        if (!"PENDING".equals(leaveRequest.getStatus())) {
            throw new AppException("Đơn nghỉ phép này đã được xử lý rồi", HttpStatus.BAD_REQUEST);
        }

        Employee manager = employeeRepository.findById(managerId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy quản lý phê duyệt"));

        int currentYear = leaveRequest.getStartDate().getYear();
        LeaveType leaveType = leaveRequest.getLeaveType();

        LeaveBalance balance = null;
        if (leaveType.getDaysPerYear() != null) {
            balance = leaveBalanceRepository.findByEmployeeIdAndLeaveTypeIdAndYear(
                    leaveRequest.getEmployee().getId(), leaveType.getId(), currentYear
            ).orElse(null);
        }

        if ("APPROVED".equalsIgnoreCase(approval.getStatus())) {
            leaveRequest.setStatus("APPROVED");
            if (balance != null) {
                // Duyệt: Trừ pending, cộng vào used
                balance.setPendingDays(balance.getPendingDays().subtract(leaveRequest.getTotalDays()));
                balance.setUsedDays(balance.getUsedDays().add(leaveRequest.getTotalDays()));
                leaveBalanceRepository.save(balance);
            }
        } else {
            leaveRequest.setStatus("REJECTED");
            if (balance != null) {
                // Từ chối: Trả lại số ngày từ pending về remaining
                balance.setPendingDays(balance.getPendingDays().subtract(leaveRequest.getTotalDays()));
                leaveBalanceRepository.save(balance);
            }
        }

        leaveRequest.setManager(manager);
        leaveRequest.setManagerNote(approval.getManagerNote());
        leaveRequest.setReviewedAt(LocalDateTime.now());
        leaveRequest.setUpdatedAt(LocalDateTime.now());

        LeaveRequest saved = leaveRequestRepository.save(leaveRequest);
        log.info("Đã phê duyệt đơn nghỉ phép ID {} thành {}", id, approval.getStatus());

        // Gửi thông báo
        String actionStr = "APPROVED".equalsIgnoreCase(approval.getStatus()) ? "duyệt" : "từ chối";
        String notifMessage = String.format("Đơn xin nghỉ phép từ %s đến %s của bạn đã bị %s.", 
                leaveRequest.getStartDate(), leaveRequest.getEndDate(), actionStr);
        if (approval.getManagerNote() != null && !approval.getManagerNote().isEmpty()) {
            notifMessage += " Lời nhắn: " + approval.getManagerNote();
        }
        notificationService.createNotification(
                leaveRequest.getEmployee(), 
                "APPROVED".equalsIgnoreCase(approval.getStatus()) ? "LEAVE_APPROVED" : "LEAVE_REJECTED", 
                "Kết quả đơn xin nghỉ phép", 
                notifMessage, 
                "/leaves"
        );

        return convertToResponse(saved);
    }

    /**
     * HR Override đơn xin nghỉ phép
     */
    @Transactional
    public LeaveRequestResponse hrOverrideLeaveRequest(Long id, LeaveApprovalDto approval, Long hrEmployeeId) {
        LeaveRequest leaveRequest = leaveRequestRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy đơn xin nghỉ phép"));

        Employee hr = employeeRepository.findById(hrEmployeeId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy HR thực hiện thao tác"));

        int currentYear = leaveRequest.getStartDate().getYear();
        LeaveType leaveType = leaveRequest.getLeaveType();

        LeaveBalance balance = null;
        if (leaveType.getDaysPerYear() != null) {
            balance = leaveBalanceRepository.findByEmployeeIdAndLeaveTypeIdAndYear(
                    leaveRequest.getEmployee().getId(), leaveType.getId(), currentYear
            ).orElse(null);
        }

        String oldStatus = leaveRequest.getStatus();
        String newStatus = approval.getStatus();

        if (oldStatus.equalsIgnoreCase(newStatus)) {
            throw new AppException("Trạng thái mới trùng với trạng thái cũ", HttpStatus.BAD_REQUEST);
        }

        // Hoàn trả số dư phép dựa trên trạng thái cũ
        if (balance != null) {
            if ("PENDING".equalsIgnoreCase(oldStatus)) {
                balance.setPendingDays(balance.getPendingDays().subtract(leaveRequest.getTotalDays()));
            } else if ("APPROVED".equalsIgnoreCase(oldStatus)) {
                balance.setUsedDays(balance.getUsedDays().subtract(leaveRequest.getTotalDays()));
            }
            
            // Áp dụng số dư phép dựa trên trạng thái mới
            if ("APPROVED".equalsIgnoreCase(newStatus)) {
                balance.setUsedDays(balance.getUsedDays().add(leaveRequest.getTotalDays()));
            } else if ("PENDING".equalsIgnoreCase(newStatus)) {
                balance.setPendingDays(balance.getPendingDays().add(leaveRequest.getTotalDays()));
            }
            
            leaveBalanceRepository.save(balance);
        }

        leaveRequest.setStatus(newStatus);
        leaveRequest.setHrOverrideBy(hr);
        leaveRequest.setManagerNote("[HR OVERRIDE] " + approval.getManagerNote());
        leaveRequest.setReviewedAt(LocalDateTime.now());
        leaveRequest.setUpdatedAt(LocalDateTime.now());

        LeaveRequest saved = leaveRequestRepository.save(leaveRequest);
        log.info("HR đã override đơn nghỉ phép ID {} từ {} sang {}", id, oldStatus, newStatus);
        return convertToResponse(saved);
    }

    /**
     * Lấy danh sách đơn xin nghỉ phép
     */
    @Transactional(readOnly = true)
    public PageResponse<LeaveRequestResponse> getLeaveRequests(
            Long employeeId, Long managerId, String status, LocalDate startDate, LocalDate endDate,
            Long departmentId, Pageable pageable
    ) {
        Page<LeaveRequest> page = leaveRequestRepository.findLeaveRequestsWithFilters(
                employeeId, managerId, status, startDate, endDate, departmentId, pageable
        );

        List<LeaveRequestResponse> content = page.getContent().stream()
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
     * Tự động khởi tạo số dư phép cho năm mới cho nhân viên nếu chưa tồn tại
     */
    private void initializeLeaveBalancesIfNeeded(Long employeeId, Integer year) {
        List<LeaveType> leaveTypes = leaveTypeRepository.findAll();
        Employee employee = employeeRepository.findById(employeeId).orElse(null);
        if (employee == null) return;

        for (LeaveType type : leaveTypes) {
            Optional<LeaveBalance> existing = leaveBalanceRepository.findByEmployeeIdAndLeaveTypeIdAndYear(employeeId, type.getId(), year);
            if (existing.isEmpty()) {
                BigDecimal totalDays = type.getDaysPerYear() != null ? type.getDaysPerYear() : BigDecimal.ZERO;

                // Áp dụng giới hạn 16 ngày cho loại phép ANNUAL
                if ("ANNUAL".equalsIgnoreCase(type.getCode()) && totalDays.compareTo(MAX_ANNUAL_LEAVE_DAYS) > 0) {
                    totalDays = MAX_ANNUAL_LEAVE_DAYS;
                    log.info("Số ngày phép năm của nhân viên {} đã được giới hạn ở mức tối đa 16 ngày", employee.getFullName());
                }

                LeaveBalance balance = LeaveBalance.builder()
                        .employee(employee)
                        .leaveType(type)
                        .year(year)
                        .totalDays(totalDays)
                        .usedDays(BigDecimal.ZERO)
                        .pendingDays(BigDecimal.ZERO)
                        .build();

                leaveBalanceRepository.save(balance);
            }
        }
    }

    private String uploadAttachment(String employeeCode, MultipartFile file) {
        String extension = getFileExtension(file.getOriginalFilename());
        String objectName = "leave_" + employeeCode + "_" + UUID.randomUUID() + extension;
        try {
            minioService.uploadFile(documentBucket, objectName, file.getInputStream(), file.getContentType());
            return objectName;
        } catch (IOException e) {
            throw new AppException("Lỗi đọc file đính kèm đơn xin nghỉ", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    private String getFileExtension(String filename) {
        if (filename == null) return "";
        int lastIndex = filename.lastIndexOf('.');
        return lastIndex == -1 ? "" : filename.substring(lastIndex);
    }

    private LeaveRequestResponse convertToResponse(LeaveRequest entity) {
        String documentUrl = null;
        if (entity.getAttachmentUrl() != null) {
            documentUrl = minioService.getPresignedUrl(documentBucket, entity.getAttachmentUrl(), 30);
        }

        Long managerId = null;
        String managerName = null;
        if (entity.getManager() != null) {
            managerId = entity.getManager().getId();
            managerName = entity.getManager().getFullName();
        }

        return LeaveRequestResponse.builder()
                .id(entity.getId())
                .employeeId(entity.getEmployee().getId())
                .employeeCode(entity.getEmployee().getEmployeeCode())
                .employeeName(entity.getEmployee().getFullName())
                .leaveTypeId(entity.getLeaveType().getId())
                .leaveTypeCode(entity.getLeaveType().getCode())
                .leaveTypeName(entity.getLeaveType().getName())
                .startDate(entity.getStartDate())
                .endDate(entity.getEndDate())
                .totalDays(entity.getTotalDays())
                .reason(entity.getReason())
                .status(entity.getStatus())
                .managerId(managerId)
                .managerName(managerName)
                .managerNote(entity.getManagerNote())
                .reviewedAt(entity.getReviewedAt())
                .attachmentUrl(documentUrl != null ? documentUrl : entity.getAttachmentUrl())
                .createdAt(entity.getCreatedAt())
                .build();
    }

    private LeaveBalanceResponse convertToBalanceResponse(LeaveBalance balance) {
        return LeaveBalanceResponse.builder()
                .id(balance.getId())
                .employeeId(balance.getEmployee().getId())
                .employeeName(balance.getEmployee().getFullName())
                .leaveTypeId(balance.getLeaveType().getId())
                .leaveTypeCode(balance.getLeaveType().getCode())
                .leaveTypeName(balance.getLeaveType().getName())
                .year(balance.getYear())
                .totalDays(balance.getTotalDays())
                .usedDays(balance.getUsedDays())
                .pendingDays(balance.getPendingDays())
                .remainingDays(balance.getRemainingDays())
                .build();
    }
}
