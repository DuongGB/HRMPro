package com.hrmpro.module.organization.service;

import com.hrmpro.common.exception.AppException;
import com.hrmpro.common.exception.ResourceNotFoundException;
import com.hrmpro.module.employee.entity.Employee;
import com.hrmpro.module.employee.repository.EmployeeRepository;
import com.hrmpro.module.organization.dto.DepartmentRequest;
import com.hrmpro.module.organization.dto.DepartmentResponse;
import com.hrmpro.module.organization.entity.Department;
import com.hrmpro.module.organization.repository.DepartmentRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("DepartmentService Unit Tests")
class DepartmentServiceTest {

    @Mock private DepartmentRepository departmentRepository;
    @Mock private EmployeeRepository employeeRepository;

    @InjectMocks
    private DepartmentService departmentService;

    @Test
    @DisplayName("getDepartmentTree — dựng cây cha-con thành công")
    void getDepartmentTree_Success() {
        Department exec = Department.builder().id(1L).code("DEP-EXEC").name("Exec").parentId(null).isActive(true).build();
        Department it = Department.builder().id(2L).code("DEP-IT").name("IT").parentId(1L).isActive(true).build();

        when(departmentRepository.findAll()).thenReturn(List.of(exec, it));

        List<DepartmentResponse> tree = departmentService.getDepartmentTree();

        assertThat(tree).hasSize(1); // Chỉ Exec là root
        assertThat(tree.get(0).getCode()).isEqualTo("DEP-EXEC");
        assertThat(tree.get(0).getChildren()).hasSize(1);
        assertThat(tree.get(0).getChildren().get(0).getCode()).isEqualTo("DEP-IT");
    }

    @Test
    @DisplayName("createDepartment — thành công")
    void createDepartment_Success() {
        DepartmentRequest request = DepartmentRequest.builder()
                .code("DEP-HR")
                .name("HR Dept")
                .parentId(1L)
                .managerId(10L)
                .build();

        when(departmentRepository.existsByCode("DEP-HR")).thenReturn(false);
        when(departmentRepository.existsById(1L)).thenReturn(true);
        when(employeeRepository.existsById(10L)).thenReturn(true);

        Department saved = Department.builder()
                .id(3L)
                .code("DEP-HR")
                .name("HR Dept")
                .parentId(1L)
                .managerId(10L)
                .isActive(true)
                .build();
        when(departmentRepository.save(any(Department.class))).thenReturn(saved);

        DepartmentResponse result = departmentService.createDepartment(request);

        assertThat(result.getCode()).isEqualTo("DEP-HR");
        assertThat(result.getParentId()).isEqualTo(1L);
        verify(departmentRepository).save(any(Department.class));
    }

    @Test
    @DisplayName("createDepartment — trùng code → ném ngoại lệ")
    void createDepartment_DuplicateCode_ThrowsException() {
        DepartmentRequest request = DepartmentRequest.builder().code("DEP-HR").build();
        when(departmentRepository.existsByCode("DEP-HR")).thenReturn(true);

        assertThatThrownBy(() -> departmentService.createDepartment(request))
                .isInstanceOf(AppException.class)
                .hasMessageContaining("Mã phòng ban 'DEP-HR' đã tồn tại");
    }

    @Test
    @DisplayName("updateDepartment — đổi parentId thành chính mình → ném ngoại lệ")
    void updateDepartment_ParentIsSelf_ThrowsException() {
        DepartmentRequest request = DepartmentRequest.builder()
                .code("DEP-IT")
                .name("IT Dept")
                .parentId(2L) // parentId trùng ID hiện tại
                .build();

        Department department = Department.builder().id(2L).code("DEP-IT").build();
        when(departmentRepository.findById(2L)).thenReturn(Optional.of(department));

        assertThatThrownBy(() -> departmentService.updateDepartment(2L, request))
                .isInstanceOf(AppException.class)
                .hasMessageContaining("Phòng ban cha không thể là chính nó");
    }

    @Test
    @DisplayName("deleteDepartment — có phòng ban con → ném ngoại lệ")
    void deleteDepartment_HasChildren_ThrowsException() {
        Department parent = Department.builder().id(1L).code("DEP-EXEC").build();
        Department child = Department.builder().id(2L).parentId(1L).build();

        when(departmentRepository.findById(1L)).thenReturn(Optional.of(parent));
        when(departmentRepository.findAll()).thenReturn(List.of(parent, child));

        assertThatThrownBy(() -> departmentService.deleteDepartment(1L))
                .isInstanceOf(AppException.class)
                .hasMessageContaining("Không thể xóa phòng ban đang có phòng ban con");
    }

    @Test
    @DisplayName("deleteDepartment — không có phòng ban con → xóa mềm thành công")
    void deleteDepartment_Success() {
        Department parent = Department.builder().id(1L).code("DEP-EXEC").isActive(true).build();

        when(departmentRepository.findById(1L)).thenReturn(Optional.of(parent));
        when(departmentRepository.findAll()).thenReturn(List.of(parent));
        when(departmentRepository.save(any(Department.class))).thenAnswer(i -> i.getArgument(0));

        departmentService.deleteDepartment(1L);

        assertThat(parent.getIsActive()).isFalse();
        verify(departmentRepository).save(parent);
    }

    @Test
    @DisplayName("updateDepartment — thành công")
    void updateDepartment_Success() {
        DepartmentRequest request = DepartmentRequest.builder()
                .code("DEP-IT-NEW")
                .name("IT Division")
                .parentId(1L)
                .managerId(10L)
                .build();

        Department department = Department.builder().id(2L).code("DEP-IT").name("IT").isActive(true).build();

        when(departmentRepository.findById(2L)).thenReturn(Optional.of(department));
        when(departmentRepository.existsByCode("DEP-IT-NEW")).thenReturn(false);
        when(departmentRepository.existsById(1L)).thenReturn(true);
        when(employeeRepository.existsById(10L)).thenReturn(true);
        when(departmentRepository.save(any(Department.class))).thenAnswer(i -> i.getArgument(0));

        DepartmentResponse result = departmentService.updateDepartment(2L, request);

        assertThat(result.getCode()).isEqualTo("DEP-IT-NEW");
        assertThat(result.getName()).isEqualTo("IT Division");
        assertThat(result.getParentId()).isEqualTo(1L);
        assertThat(result.getManagerId()).isEqualTo(10L);
        verify(departmentRepository).save(any(Department.class));
    }

    @Test
    @DisplayName("updateDepartment — trùng code với phòng ban khác → ném ngoại lệ")
    void updateDepartment_DuplicateCode_ThrowsException() {
        DepartmentRequest request = DepartmentRequest.builder().code("DEP-HR").build();
        Department department = Department.builder().id(2L).code("DEP-IT").build();

        when(departmentRepository.findById(2L)).thenReturn(Optional.of(department));
        when(departmentRepository.existsByCode("DEP-HR")).thenReturn(true);

        assertThatThrownBy(() -> departmentService.updateDepartment(2L, request))
                .isInstanceOf(AppException.class)
                .hasMessageContaining("Mã phòng ban 'DEP-HR' đã tồn tại");
    }

    @Test
    @DisplayName("updateDepartment — không tìm thấy phòng ban → ném ResourceNotFoundException")
    void updateDepartment_NotFound_ThrowsException() {
        DepartmentRequest request = DepartmentRequest.builder().code("DEP-IT").build();
        when(departmentRepository.findById(2L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> departmentService.updateDepartment(2L, request))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("Không tìm thấy phòng ban");
    }

    @Test
    @DisplayName("createDepartment — không tìm thấy parent → ném ResourceNotFoundException")
    void createDepartment_ParentNotFound_ThrowsException() {
        DepartmentRequest request = DepartmentRequest.builder().code("DEP-HR").parentId(99L).build();
        when(departmentRepository.existsByCode("DEP-HR")).thenReturn(false);
        when(departmentRepository.existsById(99L)).thenReturn(false);

        assertThatThrownBy(() -> departmentService.createDepartment(request))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("Không tìm thấy phòng ban cha");
    }

    @Test
    @DisplayName("createDepartment — không tìm thấy manager → ném ResourceNotFoundException")
    void createDepartment_ManagerNotFound_ThrowsException() {
        DepartmentRequest request = DepartmentRequest.builder().code("DEP-HR").managerId(99L).build();
        when(departmentRepository.existsByCode("DEP-HR")).thenReturn(false);
        when(employeeRepository.existsById(99L)).thenReturn(false);

        assertThatThrownBy(() -> departmentService.createDepartment(request))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("Không tìm thấy quản lý");
    }
}

