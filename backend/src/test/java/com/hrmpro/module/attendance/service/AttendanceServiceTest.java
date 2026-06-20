package com.hrmpro.module.attendance.service;

import com.hrmpro.common.dto.PageResponse;
import com.hrmpro.common.exception.ResourceNotFoundException;
import com.hrmpro.module.attendance.dto.AttendanceAdjustmentRequest;
import com.hrmpro.module.attendance.dto.AttendanceLogResponse;
import com.hrmpro.module.attendance.dto.CheckInRequest;
import com.hrmpro.module.attendance.entity.AttendanceLog;
import com.hrmpro.module.attendance.repository.AttendanceLogRepository;
import com.hrmpro.module.employee.entity.Employee;
import com.hrmpro.module.employee.repository.EmployeeRepository;
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

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("AttendanceService Unit Tests")
class AttendanceServiceTest {

    @InjectMocks private AttendanceService attendanceService;

    @Mock private AttendanceLogRepository attendanceLogRepository;
    @Mock private EmployeeRepository employeeRepository;

    private Employee employee;

    @BeforeEach
    void setUp() {
        employee = TestFixtures.defaultEmployee();
    }

    @Nested
    @DisplayName("check (Single-button)")
    class Check {

        @Test
        @DisplayName("Lần đầu check trong ngày → tạo bản ghi check-in, status ON_TIME")
        void check_FirstTimeToday_CreatesCheckIn() {
            CheckInRequest request = CheckInRequest.builder()
                    .ipAddress("192.168.1.1").location("Văn phòng HCM").build();

            when(employeeRepository.findById(1L)).thenReturn(Optional.of(employee));
            when(attendanceLogRepository.findByEmployeeIdAndWorkDate(eq(1L), any(LocalDate.class)))
                    .thenReturn(Optional.empty());
            when(attendanceLogRepository.save(any(AttendanceLog.class))).thenAnswer(inv -> {
                AttendanceLog log = inv.getArgument(0);
                log.setId(1L);
                return log;
            });

            AttendanceLogResponse result = attendanceService.check(1L, request);

            assertThat(result.getCheckCount()).isEqualTo(1);
            verify(attendanceLogRepository).save(any(AttendanceLog.class));
        }

        @Test
        @DisplayName("Lần thứ hai check → cập nhật checkout, tăng checkCount")
        void check_SecondTime_UpdatesCheckOut() {
            CheckInRequest request = CheckInRequest.builder().ipAddress("192.168.1.1").build();

            AttendanceLog existingLog = AttendanceLog.builder()
                    .id(1L).employee(employee).workDate(LocalDate.now())
                    .checkIn(LocalDateTime.of(LocalDate.now(), LocalTime.of(8, 0)))
                    .checkCount(1).status("ON_TIME").build();

            when(employeeRepository.findById(1L)).thenReturn(Optional.of(employee));
            when(attendanceLogRepository.findByEmployeeIdAndWorkDate(eq(1L), any(LocalDate.class)))
                    .thenReturn(Optional.of(existingLog));
            when(attendanceLogRepository.save(any(AttendanceLog.class))).thenReturn(existingLog);

            AttendanceLogResponse result = attendanceService.check(1L, request);

            assertThat(existingLog.getCheckCount()).isEqualTo(2);
            assertThat(existingLog.getCheckOut()).isNotNull();
        }

        @Test
        @DisplayName("Employee không tồn tại → ResourceNotFoundException")
        void check_EmployeeNotFound() {
            when(employeeRepository.findById(999L)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> attendanceService.check(999L,
                    CheckInRequest.builder().build()))
                    .isInstanceOf(ResourceNotFoundException.class);
        }
    }

    @Nested
    @DisplayName("requestAdjustment")
    class RequestAdjustment {

        @Test
        @DisplayName("Gửi yêu cầu điều chỉnh công thành công")
        void requestAdjustment_Success() {
            AttendanceAdjustmentRequest request = AttendanceAdjustmentRequest.builder()
                    .workDate(LocalDate.now().minusDays(1))
                    .checkIn(LocalDateTime.of(LocalDate.now().minusDays(1), LocalTime.of(8, 30)))
                    .checkOut(LocalDateTime.of(LocalDate.now().minusDays(1), LocalTime.of(17, 30)))
                    .note("Quên chấm công").build();

            AttendanceLog existingLog = AttendanceLog.builder()
                    .id(1L).employee(employee).workDate(request.getWorkDate())
                    .checkIn(LocalDateTime.of(request.getWorkDate(), LocalTime.of(9, 0)))
                    .status("LATE").build();

            when(employeeRepository.findById(1L)).thenReturn(Optional.of(employee));
            when(attendanceLogRepository.findByEmployeeIdAndWorkDate(1L, request.getWorkDate()))
                    .thenReturn(Optional.of(existingLog));
            when(attendanceLogRepository.save(any(AttendanceLog.class))).thenReturn(existingLog);

            AttendanceLogResponse result = attendanceService.requestAdjustment(1L, request);

            assertThat(existingLog.getStatus()).isEqualTo("PENDING_ADJUST");
        }

        @Test
        @DisplayName("Điều chỉnh cho ngày chưa có bản ghi → tạo mới")
        void requestAdjustment_NewRecord() {
            AttendanceAdjustmentRequest request = AttendanceAdjustmentRequest.builder()
                    .workDate(LocalDate.now().minusDays(3))
                    .checkIn(LocalDateTime.of(LocalDate.now().minusDays(3), LocalTime.of(8, 30)))
                    .note("Quên chấm").build();

            when(employeeRepository.findById(1L)).thenReturn(Optional.of(employee));
            when(attendanceLogRepository.findByEmployeeIdAndWorkDate(1L, request.getWorkDate()))
                    .thenReturn(Optional.empty());
            when(attendanceLogRepository.save(any(AttendanceLog.class))).thenAnswer(inv -> {
                AttendanceLog log = inv.getArgument(0);
                log.setId(10L);
                return log;
            });

            AttendanceLogResponse result = attendanceService.requestAdjustment(1L, request);

            verify(attendanceLogRepository).save(argThat(log ->
                    "PENDING_ADJUST".equals(log.getStatus())));
        }
    }

    @Nested
    @DisplayName("approveAdjustment")
    class ApproveAdjustment {

        @Test
        @DisplayName("Phê duyệt điều chỉnh → status ON_TIME")
        void approveAdjustment_Approved() {
            Employee manager = TestFixtures.managerEmployee();
            AttendanceLog log = AttendanceLog.builder()
                    .id(1L).employee(employee).workDate(LocalDate.now())
                    .status("PENDING_ADJUST").note("Quên chấm").build();

            when(attendanceLogRepository.findById(1L)).thenReturn(Optional.of(log));
            when(employeeRepository.findById(3L)).thenReturn(Optional.of(manager));
            when(attendanceLogRepository.save(any(AttendanceLog.class))).thenReturn(log);

            AttendanceLogResponse result = attendanceService.approveAdjustment(1L, true, 3L);

            assertThat(log.getStatus()).isEqualTo("ON_TIME");
            assertThat(log.getApprovedBy()).isEqualTo(manager);
        }

        @Test
        @DisplayName("Từ chối điều chỉnh → status ABSENT")
        void approveAdjustment_Rejected() {
            Employee manager = TestFixtures.managerEmployee();
            AttendanceLog log = AttendanceLog.builder()
                    .id(1L).employee(employee).workDate(LocalDate.now())
                    .status("PENDING_ADJUST").note("Quên chấm").build();

            when(attendanceLogRepository.findById(1L)).thenReturn(Optional.of(log));
            when(employeeRepository.findById(3L)).thenReturn(Optional.of(manager));
            when(attendanceLogRepository.save(any(AttendanceLog.class))).thenReturn(log);

            AttendanceLogResponse result = attendanceService.approveAdjustment(1L, false, 3L);

            assertThat(log.getStatus()).isEqualTo("ABSENT");
        }
    }

    @Nested
    @DisplayName("getAttendanceLogs")
    class GetAttendanceLogs {

        @Test
        @DisplayName("Lấy danh sách logs phân trang thành công")
        void getAttendanceLogs_WithFilters() {
            AttendanceLog log = AttendanceLog.builder()
                    .id(1L).employee(employee).workDate(LocalDate.now())
                    .checkIn(LocalDateTime.now()).status("ON_TIME").checkCount(1).build();

            Page<AttendanceLog> page = new PageImpl<>(List.of(log));
            when(attendanceLogRepository.findAttendanceLogsWithFilters(any(), any(), any(), any(), any(), any(), any()))
                    .thenReturn(page);

            PageResponse<AttendanceLogResponse> result = attendanceService.getAttendanceLogs(
                    null, null, null, null, null, null, PageRequest.of(0, 10));

            assertThat(result.content()).hasSize(1);
            assertThat(result.content().get(0).getStatus()).isEqualTo("ON_TIME");
        }
    }
}
