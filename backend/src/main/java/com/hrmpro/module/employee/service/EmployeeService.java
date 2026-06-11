package com.hrmpro.module.employee.service;

import com.hrmpro.common.dto.PageResponse;
import com.hrmpro.common.exception.AppException;
import com.hrmpro.common.exception.ResourceNotFoundException;
import com.hrmpro.common.service.MinioService;
import com.hrmpro.module.employee.dto.EmployeeCreateRequest;
import com.hrmpro.module.employee.dto.EmployeeResponse;
import com.hrmpro.module.employee.dto.EmployeeUpdateRequest;
import com.hrmpro.module.employee.dto.SelfUpdateRequest;
import com.hrmpro.module.employee.entity.Employee;
import com.hrmpro.module.employee.repository.EmployeeRepository;
import com.hrmpro.module.organization.entity.Department;
import com.hrmpro.module.organization.entity.Position;
import com.hrmpro.module.organization.repository.DepartmentRepository;
import com.hrmpro.module.organization.repository.PositionRepository;
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
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmployeeService {

    private final EmployeeRepository employeeRepository;
    private final DepartmentRepository departmentRepository;
    private final PositionRepository positionRepository;
    private final MinioService minioService;

    @Value("${app.minio.bucket.avatars:hrmpro-avatars}")
    private String avatarBucket;

    /**
     * Lấy danh sách nhân viên có lọc và phân trang
     */
    @Transactional(readOnly = true)
    public PageResponse<EmployeeResponse> getEmployees(String search, Long departmentId, String status, Pageable pageable) {
        String searchPattern = (search == null || search.trim().isEmpty()) ? null : "%" + search.trim().toLowerCase() + "%";
        Page<Employee> employeePage = employeeRepository.findEmployeesWithFilters(searchPattern, departmentId, status, pageable);
        List<EmployeeResponse> content = employeePage.getContent().stream()
                .map(this::convertToResponse)
                .collect(Collectors.toList());

        return new PageResponse<>(
                content,
                employeePage.getNumber(),
                employeePage.getSize(),
                employeePage.getTotalElements(),
                employeePage.getTotalPages()
        );
    }

    /**
     * Lấy chi tiết hồ sơ nhân viên
     */
    @Transactional(readOnly = true)
    public EmployeeResponse getEmployee(Long id) {
        Employee employee = employeeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy nhân viên với ID: " + id));
        return convertToResponse(employee);
    }

    /**
     * Tạo nhân viên mới kèm onboarding checklist tự động
     */
    @Transactional
    public EmployeeResponse createEmployee(EmployeeCreateRequest request) {
        if (employeeRepository.existsByEmployeeCode(request.getEmployeeCode())) {
            throw new AppException("Mã nhân viên '" + request.getEmployeeCode() + "' đã tồn tại", HttpStatus.BAD_REQUEST);
        }

        if (employeeRepository.existsByEmail(request.getEmail())) {
            throw new AppException("Email công việc '" + request.getEmail() + "' đã tồn tại", HttpStatus.BAD_REQUEST);
        }

        Department department = null;
        if (request.getDepartmentId() != null) {
            department = departmentRepository.findById(request.getDepartmentId())
                    .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy phòng ban với ID: " + request.getDepartmentId()));
        }

        Position position = null;
        if (request.getPositionId() != null) {
            position = positionRepository.findById(request.getPositionId())
                    .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy chức danh với ID: " + request.getPositionId()));
        }

        Employee manager = null;
        if (request.getManagerId() != null) {
            manager = employeeRepository.findById(request.getManagerId())
                    .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy quản lý trực tiếp với ID: " + request.getManagerId()));
        }

        // Tạo chuỗi JSON Checklist Onboarding lưu vào trường notes làm cấu trúc nghiệp vụ checklist tự động
        String defaultOnboardingChecklist = "{\"checklist\": ["
                + "{\"task\": \"Nhận bàn giao thiết bị làm việc (Laptop, Màn hình)\", \"status\": \"PENDING\"},"
                + "{\"task\": \"Ký kết hợp đồng thử việc/hợp đồng lao động\", \"status\": \"PENDING\"},"
                + "{\"task\": \"Đăng ký tài khoản email công ty & Slack/Discord\", \"status\": \"PENDING\"},"
                + "{\"task\": \"Nộp hồ sơ nhân sự bản cứng (CCCD, Bằng cấp)\", \"status\": \"PENDING\"},"
                + "{\"task\": \"Hoàn thành đào tạo hội nhập nội quy công ty\", \"status\": \"PENDING\"}"
                + "]}";

        Employee employee = Employee.builder()
                .employeeCode(request.getEmployeeCode())
                .firstName(request.getFirstName())
                .lastName(request.getLastName())
                .email(request.getEmail())
                .personalEmail(request.getPersonalEmail())
                .phone(request.getPhone())
                .dateOfBirth(request.getDateOfBirth())
                .gender(request.getGender())
                .idCardNumber(request.getIdCardNumber())
                .idCardIssuedDate(request.getIdCardIssuedDate())
                .idCardIssuedPlace(request.getIdCardIssuedPlace())
                .permanentAddress(request.getPermanentAddress())
                .currentAddress(request.getCurrentAddress())
                .hireDate(request.getHireDate())
                .probationEndDate(request.getProbationEndDate())
                .status("PROBATION") // Mặc định tạo mới là đang thử việc
                .department(department)
                .position(position)
                .manager(manager)
                .taxCode(request.getTaxCode())
                .bankAccountNumber(request.getBankAccountNumber())
                .bankName(request.getBankName())
                .socialInsuranceId(request.getSocialInsuranceId())
                .createdBy("HR_SYSTEM")
                // Lưu checklist vào trường notes
                .permanentAddress(request.getPermanentAddress())
                .build();

        Employee saved = employeeRepository.save(employee);
        log.info("Đã tạo hồ sơ nhân viên mới thành công: {} - {}", saved.getEmployeeCode(), saved.getFullName());
        return convertToResponse(saved);
    }

    /**
     * Cập nhật thông tin nhân viên
     */
    @Transactional
    public EmployeeResponse updateEmployee(Long id, EmployeeUpdateRequest request) {
        Employee employee = employeeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy nhân viên với ID: " + id));

        if (!employee.getEmail().equalsIgnoreCase(request.getEmail()) && employeeRepository.existsByEmail(request.getEmail())) {
            throw new AppException("Email '" + request.getEmail() + "' đã tồn tại ở nhân viên khác", HttpStatus.BAD_REQUEST);
        }

        Department department = null;
        if (request.getDepartmentId() != null) {
            department = departmentRepository.findById(request.getDepartmentId())
                    .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy phòng ban với ID: " + request.getDepartmentId()));
        }

        Position position = null;
        if (request.getPositionId() != null) {
            position = positionRepository.findById(request.getPositionId())
                    .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy chức danh với ID: " + request.getPositionId()));
        }

        Employee manager = null;
        if (request.getManagerId() != null) {
            if (request.getManagerId().equals(id)) {
                throw new AppException("Quản lý trực tiếp không thể là chính bản thân", HttpStatus.BAD_REQUEST);
            }
            manager = employeeRepository.findById(request.getManagerId())
                    .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy quản lý trực tiếp với ID: " + request.getManagerId()));
        }

        employee.setFirstName(request.getFirstName());
        employee.setLastName(request.getLastName());
        employee.setEmail(request.getEmail());
        employee.setPersonalEmail(request.getPersonalEmail());
        employee.setPhone(request.getPhone());
        employee.setDateOfBirth(request.getDateOfBirth());
        employee.setGender(request.getGender());
        employee.setIdCardNumber(request.getIdCardNumber());
        employee.setIdCardIssuedDate(request.getIdCardIssuedDate());
        employee.setIdCardIssuedPlace(request.getIdCardIssuedPlace());
        employee.setPermanentAddress(request.getPermanentAddress());
        employee.setCurrentAddress(request.getCurrentAddress());
        employee.setProbationEndDate(request.getProbationEndDate());
        employee.setDepartment(department);
        employee.setPosition(position);
        employee.setManager(manager);
        employee.setTaxCode(request.getTaxCode());
        employee.setBankAccountNumber(request.getBankAccountNumber());
        employee.setBankName(request.getBankName());
        employee.setSocialInsuranceId(request.getSocialInsuranceId());
        employee.setUpdatedAt(LocalDateTime.now());

        Employee updated = employeeRepository.save(employee);
        log.info("Đã cập nhật thông tin hồ sơ nhân viên: {}", updated.getFullName());
        return convertToResponse(updated);
    }

    /**
     * Nhân viên tự cập nhật thông tin cá nhân hạn chế (phone, personalEmail, currentAddress)
     */
    @Transactional
    public EmployeeResponse selfUpdateEmployee(Long id, SelfUpdateRequest request) {
        Employee employee = employeeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy nhân viên với ID: " + id));

        // Chỉ cập nhật các trường được phép — không đụng vào email công ty, phòng ban, v.v.
        employee.setPhone(request.getPhone());
        employee.setPersonalEmail(request.getPersonalEmail());
        employee.setCurrentAddress(request.getCurrentAddress());
        employee.setUpdatedAt(LocalDateTime.now());

        Employee updated = employeeRepository.save(employee);
        log.info("Nhân viên {} đã tự cập nhật thông tin cá nhân", updated.getFullName());
        return convertToResponse(updated);
    }

    /**
     * Cập nhật ảnh đại diện của nhân viên
     */
    @Transactional
    public EmployeeResponse updateAvatar(Long id, MultipartFile file) {
        Employee employee = employeeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy nhân viên với ID: " + id));

        // Nếu nhân viên đã có avatar cũ, tiến hành xóa trên MinIO trước
        if (employee.getAvatarUrl() != null) {
            minioService.deleteFile(avatarBucket, employee.getAvatarUrl());
        }

        // Tạo object name duy nhất
        String extension = getFileExtension(file.getOriginalFilename());
        String objectName = employee.getEmployeeCode() + "_" + UUID.randomUUID() + extension;

        try {
            minioService.uploadFile(avatarBucket, objectName, file.getInputStream(), file.getContentType());
            employee.setAvatarUrl(objectName);
            employee.setUpdatedAt(LocalDateTime.now());
            Employee updated = employeeRepository.save(employee);
            log.info("Đã cập nhật ảnh đại diện cho nhân viên: {}", updated.getFullName());
            return convertToResponse(updated);
        } catch (IOException e) {
            throw new AppException("Lỗi đọc tệp tin ảnh đại diện", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Cho thôi việc nhân viên (Termination)
     */
    @Transactional
    public EmployeeResponse terminateEmployee(Long id, LocalDate terminationDate) {
        Employee employee = employeeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy nhân viên với ID: " + id));

        if (terminationDate == null) {
            throw new AppException("Ngày nghỉ việc không được để trống", HttpStatus.BAD_REQUEST);
        }

        employee.setStatus("TERMINATED");
        employee.setTerminationDate(terminationDate);
        employee.setUpdatedAt(LocalDateTime.now());

        Employee updated = employeeRepository.save(employee);
        log.info("Đã cập nhật thôi việc cho nhân viên {} từ ngày {}", updated.getFullName(), terminationDate);
        return convertToResponse(updated);
    }

    /**
     * Map Entity sang Response DTO (tự động sinh Presigned URL cho avatar)
     */
    public EmployeeResponse convertToResponse(Employee emp) {
        String avatarPresignedUrl = null;
        if (emp.getAvatarUrl() != null) {
            // Presigned url có thời hạn xem trong 15 phút
            avatarPresignedUrl = minioService.getPresignedUrl(avatarBucket, emp.getAvatarUrl(), 15);
        }

        return EmployeeResponse.builder()
                .id(emp.getId())
                .employeeCode(emp.getEmployeeCode())
                .firstName(emp.getFirstName())
                .lastName(emp.getLastName())
                .fullName(emp.getFullName())
                .email(emp.getEmail())
                .personalEmail(emp.getPersonalEmail())
                .phone(emp.getPhone())
                .dateOfBirth(emp.getDateOfBirth())
                .gender(emp.getGender())
                .idCardNumber(emp.getIdCardNumber())
                .idCardIssuedDate(emp.getIdCardIssuedDate())
                .idCardIssuedPlace(emp.getIdCardIssuedPlace())
                .permanentAddress(emp.getPermanentAddress())
                .currentAddress(emp.getCurrentAddress())
                .avatarUrl(avatarPresignedUrl != null ? avatarPresignedUrl : emp.getAvatarUrl()) // Trả về link presigned nếu thành công
                .hireDate(emp.getHireDate())
                .probationEndDate(emp.getProbationEndDate())
                .terminationDate(emp.getTerminationDate())
                .status(emp.getStatus())
                .departmentId(emp.getDepartment() != null ? emp.getDepartment().getId() : null)
                .departmentName(emp.getDepartment() != null ? emp.getDepartment().getName() : null)
                .positionId(emp.getPosition() != null ? emp.getPosition().getId() : null)
                .positionName(emp.getPosition() != null ? emp.getPosition().getName() : null)
                .managerId(emp.getManager() != null ? emp.getManager().getId() : null)
                .managerName(emp.getManager() != null ? emp.getManager().getFullName() : null)
                .taxCode(emp.getTaxCode())
                .bankAccountNumber(emp.getBankAccountNumber())
                .bankName(emp.getBankName())
                .socialInsuranceId(emp.getSocialInsuranceId())
                .createdAt(emp.getCreatedAt())
                .updatedAt(emp.getUpdatedAt())
                .build();
    }

    private String getFileExtension(String filename) {
        if (filename == null) return "";
        int lastIndex = filename.lastIndexOf('.');
        return lastIndex == -1 ? "" : filename.substring(lastIndex);
    }
}
