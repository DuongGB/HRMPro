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
import com.hrmpro.module.auth.repository.UserRepository;
import com.hrmpro.module.organization.entity.Department;
import com.hrmpro.module.organization.entity.Position;
import com.hrmpro.module.organization.repository.DepartmentRepository;
import com.hrmpro.module.organization.repository.PositionRepository;
import com.hrmpro.util.TestFixtures;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.LocalDate;
import java.io.IOException;
import java.util.List;
import java.util.Optional;
import java.util.Set;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("EmployeeService Unit Tests")
class EmployeeServiceTest {

    @InjectMocks private EmployeeService employeeService;

    @Mock private EmployeeRepository employeeRepository;
    @Mock private DepartmentRepository departmentRepository;
    @Mock private PositionRepository positionRepository;
    @Mock private MinioService minioService;
    @Mock private UserRepository userRepository;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(employeeService, "avatarBucket", "test-avatars");
    }

    @Nested
    @DisplayName("getEmployees")
    class GetEmployees {

        @Test
        @DisplayName("Lấy danh sách nhân viên phân trang + filter thành công")
        void getEmployees_WithFilters_ReturnsPaged() {
            Employee emp = TestFixtures.defaultEmployee();
            Page<Employee> page = new PageImpl<>(List.of(emp), PageRequest.of(0, 10), 1);
            when(employeeRepository.findEmployeesWithFilters(any(), isNull(), isNull(), any(Pageable.class)))
                    .thenReturn(page);
            when(userRepository.findAllLinkedEmployeeIds()).thenReturn(Set.of(1L));

            PageResponse<EmployeeResponse> result = employeeService.getEmployees("Anh", null, null, PageRequest.of(0, 10));

            assertThat(result.content()).hasSize(1);
            assertThat(result.content().get(0).getIsLinked()).isTrue();
        }
    }

    @Nested
    @DisplayName("getEmployee")
    class GetEmployee {

        @Test
        @DisplayName("Lấy chi tiết nhân viên thành công")
        void getEmployee_Success() {
            Employee emp = TestFixtures.defaultEmployee();
            when(employeeRepository.findById(1L)).thenReturn(Optional.of(emp));
            when(userRepository.existsByEmployeeId(1L)).thenReturn(false);

            EmployeeResponse result = employeeService.getEmployee(1L);

            assertThat(result.getEmployeeCode()).isEqualTo("NV001");
        }

        @Test
        @DisplayName("Nhân viên không tồn tại → ResourceNotFoundException")
        void getEmployee_NotFound() {
            when(employeeRepository.findById(999L)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> employeeService.getEmployee(999L))
                    .isInstanceOf(ResourceNotFoundException.class);
        }
    }

    @Nested
    @DisplayName("createEmployee")
    class CreateEmployee {

        @Test
        @DisplayName("Tạo nhân viên thành công — status mặc định PROBATION")
        void createEmployee_Success() {
            EmployeeCreateRequest request = EmployeeCreateRequest.builder()
                    .employeeCode("NV100")
                    .firstName("Test")
                    .lastName("User")
                    .email("test@hrmpro.vn")
                    .hireDate(LocalDate.now())
                    .build();

            when(employeeRepository.existsByEmployeeCode("NV100")).thenReturn(false);
            when(employeeRepository.existsByEmail("test@hrmpro.vn")).thenReturn(false);
            when(employeeRepository.save(any(Employee.class))).thenAnswer(inv -> {
                Employee e = inv.getArgument(0);
                e.setId(100L);
                return e;
            });
            when(userRepository.existsByEmployeeId(100L)).thenReturn(false);

            EmployeeResponse result = employeeService.createEmployee(request);

            assertThat(result.getStatus()).isEqualTo("PROBATION");
            verify(employeeRepository).save(any(Employee.class));
        }

        @Test
        @DisplayName("Mã nhân viên trùng → AppException")
        void createEmployee_DuplicateCode() {
            EmployeeCreateRequest request = EmployeeCreateRequest.builder()
                    .employeeCode("NV001").firstName("X").lastName("Y").email("x@y.vn").hireDate(LocalDate.now()).build();
            when(employeeRepository.existsByEmployeeCode("NV001")).thenReturn(true);

            assertThatThrownBy(() -> employeeService.createEmployee(request))
                    .isInstanceOf(AppException.class)
                    .hasMessageContaining("đã tồn tại");
        }

        @Test
        @DisplayName("Email trùng → AppException")
        void createEmployee_DuplicateEmail() {
            EmployeeCreateRequest request = EmployeeCreateRequest.builder()
                    .employeeCode("NV999").firstName("X").lastName("Y").email("existing@hrmpro.vn").hireDate(LocalDate.now()).build();
            when(employeeRepository.existsByEmployeeCode("NV999")).thenReturn(false);
            when(employeeRepository.existsByEmail("existing@hrmpro.vn")).thenReturn(true);

            assertThatThrownBy(() -> employeeService.createEmployee(request))
                    .isInstanceOf(AppException.class)
                    .hasMessageContaining("đã tồn tại");
        }

        @Test
        @DisplayName("Tạo nhân viên với department và position")
        void createEmployee_WithDepartmentAndPosition() {
            Department dept = TestFixtures.itDepartment();
            Position pos = TestFixtures.seniorDevPosition();

            EmployeeCreateRequest request = EmployeeCreateRequest.builder()
                    .employeeCode("NV101").firstName("X").lastName("Y").email("new@hrmpro.vn")
                    .hireDate(LocalDate.now()).departmentId(1L).positionId(1L).build();

            when(employeeRepository.existsByEmployeeCode("NV101")).thenReturn(false);
            when(employeeRepository.existsByEmail("new@hrmpro.vn")).thenReturn(false);
            when(departmentRepository.findById(1L)).thenReturn(Optional.of(dept));
            when(positionRepository.findById(1L)).thenReturn(Optional.of(pos));
            when(employeeRepository.save(any(Employee.class))).thenAnswer(inv -> {
                Employee e = inv.getArgument(0);
                e.setId(101L);
                return e;
            });
            when(userRepository.existsByEmployeeId(101L)).thenReturn(false);

            EmployeeResponse result = employeeService.createEmployee(request);

            assertThat(result.getDepartmentName()).isEqualTo("Phòng Công nghệ");
        }

        @Test
        @DisplayName("Tạo nhân viên — phòng ban không tồn tại → ResourceNotFoundException")
        void createEmployee_DepartmentNotFound() {
            EmployeeCreateRequest request = EmployeeCreateRequest.builder()
                    .employeeCode("NV102").firstName("X").lastName("Y").email("new@hrmpro.vn")
                    .hireDate(LocalDate.now()).departmentId(999L).build();

            when(employeeRepository.existsByEmployeeCode("NV102")).thenReturn(false);
            when(employeeRepository.existsByEmail("new@hrmpro.vn")).thenReturn(false);
            when(departmentRepository.findById(999L)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> employeeService.createEmployee(request))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessageContaining("Không tìm thấy phòng ban");
        }

        @Test
        @DisplayName("Tạo nhân viên — chức danh không tồn tại → ResourceNotFoundException")
        void createEmployee_PositionNotFound() {
            EmployeeCreateRequest request = EmployeeCreateRequest.builder()
                    .employeeCode("NV103").firstName("X").lastName("Y").email("new@hrmpro.vn")
                    .hireDate(LocalDate.now()).positionId(999L).build();

            when(employeeRepository.existsByEmployeeCode("NV103")).thenReturn(false);
            when(employeeRepository.existsByEmail("new@hrmpro.vn")).thenReturn(false);
            when(positionRepository.findById(999L)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> employeeService.createEmployee(request))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessageContaining("Không tìm thấy chức danh");
        }

        @Test
        @DisplayName("Tạo nhân viên — quản lý không tồn tại → ResourceNotFoundException")
        void createEmployee_ManagerNotFound() {
            EmployeeCreateRequest request = EmployeeCreateRequest.builder()
                    .employeeCode("NV104").firstName("X").lastName("Y").email("new@hrmpro.vn")
                    .hireDate(LocalDate.now()).managerId(999L).build();

            when(employeeRepository.existsByEmployeeCode("NV104")).thenReturn(false);
            when(employeeRepository.existsByEmail("new@hrmpro.vn")).thenReturn(false);
            when(employeeRepository.findById(999L)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> employeeService.createEmployee(request))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessageContaining("Không tìm thấy quản lý trực tiếp");
        }
    }

    @Nested
    @DisplayName("updateEmployee")
    class UpdateEmployee {

        @Test
        @DisplayName("Cập nhật nhân viên thành công")
        void updateEmployee_Success() {
            Employee existing = TestFixtures.defaultEmployee();
            EmployeeUpdateRequest request = new EmployeeUpdateRequest();
            request.setFirstName("Updated");
            request.setLastName("Name");
            request.setEmail("nv001@hrmpro.vn");

            when(employeeRepository.findById(1L)).thenReturn(Optional.of(existing));
            when(employeeRepository.save(any(Employee.class))).thenReturn(existing);
            when(userRepository.existsByEmployeeId(1L)).thenReturn(false);

            EmployeeResponse result = employeeService.updateEmployee(1L, request);

            verify(employeeRepository).save(any(Employee.class));
        }

        @Test
        @DisplayName("Cập nhật — email trùng với nhân viên khác → AppException")
        void updateEmployee_DuplicateEmail() {
            Employee existing = TestFixtures.defaultEmployee();
            EmployeeUpdateRequest request = new EmployeeUpdateRequest();
            request.setEmail("other@hrmpro.vn");

            when(employeeRepository.findById(1L)).thenReturn(Optional.of(existing));
            when(employeeRepository.existsByEmail("other@hrmpro.vn")).thenReturn(true);

            assertThatThrownBy(() -> employeeService.updateEmployee(1L, request))
                    .isInstanceOf(AppException.class)
                    .hasMessageContaining("đã tồn tại");
        }

        @Test
        @DisplayName("Manager không thể tự quản lý bản thân → AppException")
        void updateEmployee_SelfAsManager() {
            Employee existing = TestFixtures.defaultEmployee();
            EmployeeUpdateRequest request = new EmployeeUpdateRequest();
            request.setEmail("nv001@hrmpro.vn");
            request.setManagerId(1L);

            when(employeeRepository.findById(1L)).thenReturn(Optional.of(existing));

            assertThatThrownBy(() -> employeeService.updateEmployee(1L, request))
                    .isInstanceOf(AppException.class)
                    .hasMessageContaining("chính bản thân");
        }

        @Test
        @DisplayName("Cập nhật nhân viên — phòng ban không tồn tại → ResourceNotFoundException")
        void updateEmployee_DepartmentNotFound() {
            Employee existing = TestFixtures.defaultEmployee();
            EmployeeUpdateRequest request = new EmployeeUpdateRequest();
            request.setEmail("nv001@hrmpro.vn");
            request.setDepartmentId(999L);

            when(employeeRepository.findById(1L)).thenReturn(Optional.of(existing));
            when(departmentRepository.findById(999L)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> employeeService.updateEmployee(1L, request))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessageContaining("Không tìm thấy phòng ban");
        }

        @Test
        @DisplayName("Cập nhật nhân viên — chức danh không tồn tại → ResourceNotFoundException")
        void updateEmployee_PositionNotFound() {
            Employee existing = TestFixtures.defaultEmployee();
            EmployeeUpdateRequest request = new EmployeeUpdateRequest();
            request.setEmail("nv001@hrmpro.vn");
            request.setPositionId(999L);

            when(employeeRepository.findById(1L)).thenReturn(Optional.of(existing));
            when(positionRepository.findById(999L)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> employeeService.updateEmployee(1L, request))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessageContaining("Không tìm thấy chức danh");
        }

        @Test
        @DisplayName("Cập nhật nhân viên — quản lý không tồn tại → ResourceNotFoundException")
        void updateEmployee_ManagerNotFound() {
            Employee existing = TestFixtures.defaultEmployee();
            EmployeeUpdateRequest request = new EmployeeUpdateRequest();
            request.setEmail("nv001@hrmpro.vn");
            request.setManagerId(999L);

            when(employeeRepository.findById(1L)).thenReturn(Optional.of(existing));
            when(employeeRepository.findById(999L)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> employeeService.updateEmployee(1L, request))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessageContaining("Không tìm thấy quản lý trực tiếp");
        }
    }

    @Nested
    @DisplayName("selfUpdateEmployee")
    class SelfUpdate {

        @Test
        @DisplayName("Nhân viên tự cập nhật thông tin cá nhân thành công")
        void selfUpdateEmployee_Success() {
            Employee existing = TestFixtures.defaultEmployee();
            SelfUpdateRequest request = new SelfUpdateRequest();
            request.setPhone("0909999999");
            request.setPersonalEmail("personal@gmail.com");
            request.setCurrentAddress("Hồ Chí Minh");

            when(employeeRepository.findById(1L)).thenReturn(Optional.of(existing));
            when(employeeRepository.save(any(Employee.class))).thenReturn(existing);
            when(userRepository.existsByEmployeeId(1L)).thenReturn(false);

            EmployeeResponse result = employeeService.selfUpdateEmployee(1L, request);

            assertThat(existing.getPhone()).isEqualTo("0909999999");
            assertThat(existing.getPersonalEmail()).isEqualTo("personal@gmail.com");
        }
    }

    @Nested
    @DisplayName("updateAvatar")
    class UpdateAvatar {

        @Test
        @DisplayName("Upload avatar mới — xóa avatar cũ → upload mới")
        void updateAvatar_Success() {
            Employee existing = TestFixtures.defaultEmployee();
            existing.setAvatarUrl("old-avatar.jpg");
            MockMultipartFile file = new MockMultipartFile("file", "new-avatar.png", "image/png", "data".getBytes());

            when(employeeRepository.findById(1L)).thenReturn(Optional.of(existing));
            when(employeeRepository.save(any(Employee.class))).thenReturn(existing);
            when(userRepository.existsByEmployeeId(1L)).thenReturn(false);

            EmployeeResponse result = employeeService.updateAvatar(1L, file);

            verify(minioService).deleteFile("test-avatars", "old-avatar.jpg");
            verify(minioService).uploadFile(eq("test-avatars"), anyString(), any(), eq("image/png"));
        }

        @Test
        @DisplayName("Upload avatar mới — không có avatar cũ → upload mới thành công")
        void updateAvatar_WithoutOldAvatar_Success() {
            Employee existing = TestFixtures.defaultEmployee();
            existing.setAvatarUrl(null);
            MockMultipartFile file = new MockMultipartFile("file", "new-avatar.png", "image/png", "data".getBytes());

            when(employeeRepository.findById(1L)).thenReturn(Optional.of(existing));
            when(employeeRepository.save(any(Employee.class))).thenReturn(existing);
            when(userRepository.existsByEmployeeId(1L)).thenReturn(false);

            EmployeeResponse result = employeeService.updateAvatar(1L, file);

            verify(minioService, never()).deleteFile(anyString(), anyString());
            verify(minioService).uploadFile(eq("test-avatars"), anyString(), any(), eq("image/png"));
        }

        @Test
        @DisplayName("Upload avatar mới — gặp lỗi IOException → AppException")
        void updateAvatar_ThrowsIOException_AppException() throws IOException {
            Employee existing = TestFixtures.defaultEmployee();
            existing.setAvatarUrl(null);
            
            MultipartFile mockFile = mock(MultipartFile.class);
            when(mockFile.getOriginalFilename()).thenReturn("avatar.png");
            when(mockFile.getInputStream()).thenThrow(new IOException("Simulated IO Exception"));

            when(employeeRepository.findById(1L)).thenReturn(Optional.of(existing));

            assertThatThrownBy(() -> employeeService.updateAvatar(1L, mockFile))
                    .isInstanceOf(AppException.class)
                    .hasMessageContaining("Lỗi đọc tệp tin ảnh đại diện");
        }
    }

    @Nested
    @DisplayName("terminateEmployee")
    class TerminateEmployee {

        @Test
        @DisplayName("Cho thôi việc thành công")
        void terminateEmployee_Success() {
            Employee existing = TestFixtures.defaultEmployee();
            LocalDate termDate = LocalDate.of(2026, 7, 1);

            when(employeeRepository.findById(1L)).thenReturn(Optional.of(existing));
            when(employeeRepository.save(any(Employee.class))).thenReturn(existing);
            when(userRepository.existsByEmployeeId(1L)).thenReturn(false);

            EmployeeResponse result = employeeService.terminateEmployee(1L, termDate);

            assertThat(existing.getStatus()).isEqualTo("TERMINATED");
            assertThat(existing.getTerminationDate()).isEqualTo(termDate);
        }

        @Test
        @DisplayName("Không có ngày nghỉ việc → AppException")
        void terminateEmployee_NullDate() {
            Employee existing = TestFixtures.defaultEmployee();
            when(employeeRepository.findById(1L)).thenReturn(Optional.of(existing));

            assertThatThrownBy(() -> employeeService.terminateEmployee(1L, null))
                    .isInstanceOf(AppException.class)
                    .hasMessageContaining("không được để trống");
        }
    }

    @Nested
    @DisplayName("convertToResponse")
    class ConvertToResponse {

        @Test
        @DisplayName("Employee có avatar → response có presigned URL")
        void convertToResponse_WithAvatar() {
            Employee emp = TestFixtures.defaultEmployee();
            emp.setAvatarUrl("my-avatar.jpg");

            when(userRepository.existsByEmployeeId(1L)).thenReturn(false);
            when(minioService.getPresignedUrl("test-avatars", "my-avatar.jpg", 15))
                    .thenReturn("https://minio/presigned");

            EmployeeResponse result = employeeService.convertToResponse(emp);

            assertThat(result.getAvatarUrl()).isEqualTo("https://minio/presigned");
        }

        @Test
        @DisplayName("Employee không có avatar → avatarUrl null")
        void convertToResponse_WithoutAvatar() {
            Employee emp = TestFixtures.defaultEmployee();
            emp.setAvatarUrl(null);

            when(userRepository.existsByEmployeeId(1L)).thenReturn(false);

            EmployeeResponse result = employeeService.convertToResponse(emp);

            assertThat(result.getAvatarUrl()).isNull();
        }
    }
}
