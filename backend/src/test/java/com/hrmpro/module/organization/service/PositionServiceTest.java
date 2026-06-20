package com.hrmpro.module.organization.service;

import com.hrmpro.common.exception.AppException;
import com.hrmpro.common.exception.ResourceNotFoundException;
import com.hrmpro.module.organization.dto.PositionRequest;
import com.hrmpro.module.organization.dto.PositionResponse;
import com.hrmpro.module.organization.entity.Department;
import com.hrmpro.module.organization.entity.Position;
import com.hrmpro.module.organization.repository.DepartmentRepository;
import com.hrmpro.module.organization.repository.PositionRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("PositionService Unit Tests")
class PositionServiceTest {

    @Mock private PositionRepository positionRepository;
    @Mock private DepartmentRepository departmentRepository;

    @InjectMocks
    private PositionService positionService;

    @Test
    @DisplayName("createPosition — thành công")
    void createPosition_Success() {
        PositionRequest request = PositionRequest.builder()
                .code("POS-DEV")
                .name("Developer")
                .departmentId(1L)
                .level("MIDDLE")
                .description("Java Developer")
                .build();

        Department department = Department.builder().id(1L).name("IT").build();

        when(positionRepository.existsByCode("POS-DEV")).thenReturn(false);
        when(departmentRepository.findById(1L)).thenReturn(Optional.of(department));

        Position saved = Position.builder()
                .id(10L)
                .code("POS-DEV")
                .name("Developer")
                .department(department)
                .level("MIDDLE")
                .description("Java Developer")
                .isActive(true)
                .build();

        when(positionRepository.save(any(Position.class))).thenReturn(saved);

        PositionResponse result = positionService.createPosition(request);

        assertThat(result.getCode()).isEqualTo("POS-DEV");
        assertThat(result.getDepartmentName()).isEqualTo("IT");
        verify(positionRepository).save(any(Position.class));
    }

    @Test
    @DisplayName("createPosition — trùng code → ném ngoại lệ")
    void createPosition_DuplicateCode_ThrowsException() {
        PositionRequest request = PositionRequest.builder().code("POS-DEV").build();
        when(positionRepository.existsByCode("POS-DEV")).thenReturn(true);

        assertThatThrownBy(() -> positionService.createPosition(request))
                .isInstanceOf(AppException.class)
                .hasMessageContaining("Mã chức danh 'POS-DEV' đã tồn tại");
    }

    @Test
    @DisplayName("createPosition — phòng ban không tồn tại → ném ngoại lệ")
    void createPosition_DepartmentNotFound_ThrowsException() {
        PositionRequest request = PositionRequest.builder().code("POS-DEV").departmentId(99L).build();
        when(positionRepository.existsByCode("POS-DEV")).thenReturn(false);
        when(departmentRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> positionService.createPosition(request))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("Không tìm thấy phòng ban với ID: 99");
    }

    @Test
    @DisplayName("deletePosition — ngừng hoạt động thành công (isActive=false)")
    void deletePosition_Success() {
        Position position = Position.builder().id(10L).name("Developer").isActive(true).build();
        when(positionRepository.findById(10L)).thenReturn(Optional.of(position));
        when(positionRepository.save(any(Position.class))).thenAnswer(i -> i.getArgument(0));

        positionService.deletePosition(10L);

        assertThat(position.getIsActive()).isFalse();
        verify(positionRepository).save(position);
    }

    @Test
    @DisplayName("getAllPositions — thành công")
    void getAllPositions_Success() {
        Position position = Position.builder().id(10L).code("POS-DEV").name("Developer").isActive(true).build();
        when(positionRepository.findAll()).thenReturn(List.of(position));

        List<PositionResponse> results = positionService.getAllPositions();

        assertThat(results).hasSize(1);
        assertThat(results.get(0).getCode()).isEqualTo("POS-DEV");
    }

    @Test
    @DisplayName("getPosition — thành công")
    void getPosition_Success() {
        Position position = Position.builder().id(10L).code("POS-DEV").name("Developer").build();
        when(positionRepository.findById(10L)).thenReturn(Optional.of(position));

        PositionResponse result = positionService.getPosition(10L);

        assertThat(result).isNotNull();
        assertThat(result.getCode()).isEqualTo("POS-DEV");
    }

    @Test
    @DisplayName("getPosition — không tìm thấy → ném ResourceNotFoundException")
    void getPosition_NotFound_ThrowsException() {
        when(positionRepository.findById(10L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> positionService.getPosition(10L))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("Không tìm thấy chức danh");
    }

    @Test
    @DisplayName("updatePosition — thành công")
    void updatePosition_Success() {
        PositionRequest request = PositionRequest.builder()
                .code("POS-SENIOR")
                .name("Senior Developer")
                .departmentId(1L)
                .level("SENIOR")
                .build();

        Position position = Position.builder().id(10L).code("POS-DEV").name("Developer").isActive(true).build();
        Department department = Department.builder().id(1L).name("IT").build();

        when(positionRepository.findById(10L)).thenReturn(Optional.of(position));
        when(positionRepository.existsByCode("POS-SENIOR")).thenReturn(false);
        when(departmentRepository.findById(1L)).thenReturn(Optional.of(department));
        when(positionRepository.save(any(Position.class))).thenAnswer(i -> i.getArgument(0));

        PositionResponse result = positionService.updatePosition(10L, request);

        assertThat(result.getCode()).isEqualTo("POS-SENIOR");
        assertThat(result.getName()).isEqualTo("Senior Developer");
        verify(positionRepository).save(any(Position.class));
    }

    @Test
    @DisplayName("updatePosition — trùng code khác → ném AppException")
    void updatePosition_DuplicateCode_ThrowsException() {
        PositionRequest request = PositionRequest.builder().code("POS-HR").build();
        Position position = Position.builder().id(10L).code("POS-DEV").build();

        when(positionRepository.findById(10L)).thenReturn(Optional.of(position));
        when(positionRepository.existsByCode("POS-HR")).thenReturn(true);

        assertThatThrownBy(() -> positionService.updatePosition(10L, request))
                .isInstanceOf(AppException.class)
                .hasMessageContaining("Mã chức danh 'POS-HR' đã tồn tại");
    }

    @Test
    @DisplayName("updatePosition — không tìm thấy chức danh → ném ResourceNotFoundException")
    void updatePosition_NotFound_ThrowsException() {
        PositionRequest request = PositionRequest.builder().code("POS-DEV").build();
        when(positionRepository.findById(10L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> positionService.updatePosition(10L, request))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("Không tìm thấy chức danh");
    }

    @Test
    @DisplayName("deletePosition — không tìm thấy chức danh → ném ResourceNotFoundException")
    void deletePosition_NotFound_ThrowsException() {
        when(positionRepository.findById(10L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> positionService.deletePosition(10L))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("Không tìm thấy chức danh");
    }
}

