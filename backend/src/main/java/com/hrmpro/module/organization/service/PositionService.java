package com.hrmpro.module.organization.service;

import com.hrmpro.common.exception.AppException;
import com.hrmpro.common.exception.ResourceNotFoundException;
import com.hrmpro.module.organization.dto.PositionRequest;
import com.hrmpro.module.organization.dto.PositionResponse;
import com.hrmpro.module.organization.entity.Department;
import com.hrmpro.module.organization.entity.Position;
import com.hrmpro.module.organization.repository.DepartmentRepository;
import com.hrmpro.module.organization.repository.PositionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class PositionService {

    private final PositionRepository positionRepository;
    private final DepartmentRepository departmentRepository;

    @Transactional(readOnly = true)
    public List<PositionResponse> getAllPositions() {
        return positionRepository.findAll().stream()
                .map(this::convertToResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<PositionResponse> getPositionsByDepartment(Long departmentId) {
        return positionRepository.findByDepartmentId(departmentId).stream()
                .map(this::convertToResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public PositionResponse getPosition(Long id) {
        Position position = positionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy chức danh với ID: " + id));
        return convertToResponse(position);
    }

    @Transactional
    public PositionResponse createPosition(PositionRequest request) {
        if (positionRepository.existsByCode(request.getCode())) {
            throw new AppException("Mã chức danh '" + request.getCode() + "' đã tồn tại", HttpStatus.BAD_REQUEST);
        }

        Department department = departmentRepository.findById(request.getDepartmentId())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy phòng ban với ID: " + request.getDepartmentId()));

        Position position = Position.builder()
                .code(request.getCode())
                .name(request.getName())
                .department(department)
                .level(request.getLevel())
                .description(request.getDescription())
                .isActive(true)
                .build();

        Position saved = positionRepository.save(position);
        log.info("Đã tạo chức danh mới: {} - {}", saved.getCode(), saved.getName());
        return convertToResponse(saved);
    }

    @Transactional
    public PositionResponse updatePosition(Long id, PositionRequest request) {
        Position position = positionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy chức danh với ID: " + id));

        if (!position.getCode().equalsIgnoreCase(request.getCode()) && positionRepository.existsByCode(request.getCode())) {
            throw new AppException("Mã chức danh '" + request.getCode() + "' đã tồn tại", HttpStatus.BAD_REQUEST);
        }

        Department department = departmentRepository.findById(request.getDepartmentId())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy phòng ban với ID: " + request.getDepartmentId()));

        position.setCode(request.getCode());
        position.setName(request.getName());
        position.setDepartment(department);
        position.setLevel(request.getLevel());
        position.setDescription(request.getDescription());
        position.setUpdatedAt(LocalDateTime.now());

        Position updated = positionRepository.save(position);
        log.info("Đã cập nhật chức danh: {} - {}", updated.getCode(), updated.getName());
        return convertToResponse(updated);
    }

    @Transactional
    public void deletePosition(Long id) {
        Position position = positionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy chức danh với ID: " + id));

        position.setIsActive(false);
        positionRepository.save(position);
        log.info("Đã ngừng hoạt động chức danh: {}", position.getName());
    }

    @Transactional
    public void activatePosition(Long id) {
        Position position = positionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy chức danh với ID: " + id));

        position.setIsActive(true);
        positionRepository.save(position);
        log.info("Đã kích hoạt lại chức danh: {}", position.getName());
    }

    private PositionResponse convertToResponse(Position position) {
        return PositionResponse.builder()
                .id(position.getId())
                .code(position.getCode())
                .name(position.getName())
                .departmentId(position.getDepartment() != null ? position.getDepartment().getId() : null)
                .departmentName(position.getDepartment() != null ? position.getDepartment().getName() : null)
                .level(position.getLevel())
                .description(position.getDescription())
                .isActive(position.getIsActive())
                .build();
    }
}
