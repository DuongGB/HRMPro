package com.hrmpro.module.organization.service;

import com.hrmpro.common.exception.AppException;
import com.hrmpro.common.exception.ResourceNotFoundException;
import com.hrmpro.module.employee.entity.Employee;
import com.hrmpro.module.employee.repository.EmployeeRepository;
import com.hrmpro.module.organization.dto.DepartmentRequest;
import com.hrmpro.module.organization.dto.DepartmentResponse;
import com.hrmpro.module.organization.entity.Department;
import com.hrmpro.module.organization.repository.DepartmentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class DepartmentService {

    private final DepartmentRepository departmentRepository;
    private final EmployeeRepository employeeRepository;

    /**
     * Lấy cấu trúc cây (Tree) của tất cả các phòng ban phục vụ Org Chart
     */
    @Transactional(readOnly = true)
    public List<DepartmentResponse> getDepartmentTree() {
        List<Department> allDepts = departmentRepository.findAll();
        
        // Map chuyển từ Department sang DepartmentResponse
        Map<Long, DepartmentResponse> responseMap = allDepts.stream()
                .collect(Collectors.toMap(
                        Department::getId,
                        this::convertToResponseWithNoChildren
                ));

        List<DepartmentResponse> rootDepartments = new ArrayList<>();

        // Xây dựng liên kết cha-con
        for (Department dept : allDepts) {
            DepartmentResponse currentResponse = responseMap.get(dept.getId());
            if (dept.getParentId() == null) {
                rootDepartments.add(currentResponse);
            } else {
                DepartmentResponse parentResponse = responseMap.get(dept.getParentId());
                if (parentResponse != null) {
                    if (parentResponse.getChildren() == null) {
                        parentResponse.setChildren(new ArrayList<>());
                    }
                    parentResponse.getChildren().add(currentResponse);
                } else {
                    // Nếu không tìm thấy parentId hợp lệ trong list, xem như root
                    rootDepartments.add(currentResponse);
                }
            }
        }

        return rootDepartments;
    }

    @Transactional(readOnly = true)
    public List<DepartmentResponse> getAllDepartments() {
        return departmentRepository.findAll().stream()
                .map(this::convertToResponseWithNoChildren)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public DepartmentResponse getDepartment(Long id) {
        Department department = departmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy phòng ban với ID: " + id));
        return convertToResponseWithNoChildren(department);
    }

    @Transactional
    public DepartmentResponse createDepartment(DepartmentRequest request) {
        if (departmentRepository.existsByCode(request.getCode())) {
            throw new AppException("Mã phòng ban '" + request.getCode() + "' đã tồn tại", HttpStatus.BAD_REQUEST);
        }

        if (request.getParentId() != null && !departmentRepository.existsById(request.getParentId())) {
            throw new ResourceNotFoundException("Không tìm thấy phòng ban cha với ID: " + request.getParentId());
        }

        if (request.getManagerId() != null && !employeeRepository.existsById(request.getManagerId())) {
            throw new ResourceNotFoundException("Không tìm thấy quản lý phòng ban với ID: " + request.getManagerId());
        }

        Department department = Department.builder()
                .code(request.getCode())
                .name(request.getName())
                .parentId(request.getParentId())
                .managerId(request.getManagerId())
                .description(request.getDescription())
                .isActive(true)
                .build();

        Department saved = departmentRepository.save(department);
        log.info("Đã tạo phòng ban mới: {} - {}", saved.getCode(), saved.getName());
        return convertToResponseWithNoChildren(saved);
    }

    @Transactional
    public DepartmentResponse updateDepartment(Long id, DepartmentRequest request) {
        Department department = departmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy phòng ban với ID: " + id));

        if (!department.getCode().equalsIgnoreCase(request.getCode()) && departmentRepository.existsByCode(request.getCode())) {
            throw new AppException("Mã phòng ban '" + request.getCode() + "' đã tồn tại", HttpStatus.BAD_REQUEST);
        }

        if (request.getParentId() != null) {
            if (request.getParentId().equals(id)) {
                throw new AppException("Phòng ban cha không thể là chính nó", HttpStatus.BAD_REQUEST);
            }
            if (!departmentRepository.existsById(request.getParentId())) {
                throw new ResourceNotFoundException("Không tìm thấy phòng ban cha với ID: " + request.getParentId());
            }
        }

        if (request.getManagerId() != null && !employeeRepository.existsById(request.getManagerId())) {
            throw new ResourceNotFoundException("Không tìm thấy quản lý phòng ban với ID: " + request.getManagerId());
        }

        department.setCode(request.getCode());
        department.setName(request.getName());
        department.setParentId(request.getParentId());
        department.setManagerId(request.getManagerId());
        department.setDescription(request.getDescription());
        department.setUpdatedAt(LocalDateTime.now());

        Department updated = departmentRepository.save(department);
        log.info("Đã cập nhật phòng ban: {} - {}", updated.getCode(), updated.getName());
        return convertToResponseWithNoChildren(updated);
    }

    @Transactional
    public void deleteDepartment(Long id) {
        Department department = departmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy phòng ban với ID: " + id));

        // Kiểm tra xem có phòng ban con đang hoạt động hay không
        List<Department> allDepts = departmentRepository.findAll();
        boolean hasChildren = allDepts.stream().anyMatch(d -> id.equals(d.getParentId()));
        if (hasChildren) {
            throw new AppException("Không thể xóa phòng ban đang có phòng ban con", HttpStatus.BAD_REQUEST);
        }

        // Thực hiện xóa mềm
        department.setIsActive(false);
        departmentRepository.save(department);
        log.info("Đã ngừng hoạt động phòng ban: {}", department.getName());
    }

    private DepartmentResponse convertToResponseWithNoChildren(Department dept) {
        String parentName = null;
        if (dept.getParentId() != null) {
            parentName = departmentRepository.findById(dept.getParentId())
                    .map(Department::getName)
                    .orElse(null);
        }

        String managerCode = null;
        String managerName = null;
        if (dept.getManagerId() != null) {
            Optional<Employee> managerOpt = employeeRepository.findById(dept.getManagerId());
            if (managerOpt.isPresent()) {
                managerCode = managerOpt.get().getEmployeeCode();
                managerName = managerOpt.get().getFullName();
            }
        }

        return DepartmentResponse.builder()
                .id(dept.getId())
                .code(dept.getCode())
                .name(dept.getName())
                .parentId(dept.getParentId())
                .parentName(parentName)
                .managerId(dept.getManagerId())
                .managerCode(managerCode)
                .managerName(managerName)
                .description(dept.getDescription())
                .isActive(dept.getIsActive())
                .children(new ArrayList<>())
                .build();
    }
}
