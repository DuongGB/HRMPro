package com.hrmpro.module.leave.service;

import com.hrmpro.common.dto.PageResponse;
import com.hrmpro.common.exception.AppException;
import com.hrmpro.common.exception.ResourceNotFoundException;
import com.hrmpro.common.service.MinioService;
import com.hrmpro.module.employee.entity.Employee;
import com.hrmpro.module.employee.repository.EmployeeRepository;
import com.hrmpro.module.employee.service.NotificationService;
import com.hrmpro.module.leave.dto.*;
import com.hrmpro.module.leave.entity.LeaveBalance;
import com.hrmpro.module.leave.entity.LeaveRequest;
import com.hrmpro.module.leave.entity.LeaveType;
import com.hrmpro.module.leave.repository.LeaveBalanceRepository;
import com.hrmpro.module.leave.repository.LeaveRequestRepository;
import com.hrmpro.module.leave.repository.LeaveTypeRepository;
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
import org.springframework.test.util.ReflectionTestUtils;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("LeaveService Unit Tests")
class LeaveServiceTest {

    @InjectMocks private LeaveService leaveService;

    @Mock private LeaveRequestRepository leaveRequestRepository;
    @Mock private LeaveTypeRepository leaveTypeRepository;
    @Mock private LeaveBalanceRepository leaveBalanceRepository;
    @Mock private EmployeeRepository employeeRepository;
    @Mock private MinioService minioService;
    @Mock private NotificationService notificationService;

    private Employee employee;
    private LeaveType annualLeaveType;
    private LeaveBalance annualBalance;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(leaveService, "documentBucket", "test-documents");

        employee = TestFixtures.defaultEmployee();
        annualLeaveType = LeaveType.builder()
                .id(1L).code("ANNUAL").name("Phép năm").daysPerYear(new BigDecimal("12")).build();
        annualBalance = LeaveBalance.builder()
                .id(1L).employee(employee).leaveType(annualLeaveType).year(LocalDate.now().getYear())
                .totalDays(new BigDecimal("12")).usedDays(BigDecimal.ZERO).pendingDays(BigDecimal.ZERO)
                .remainingDays(new BigDecimal("12")).build();
    }

    @Nested
    @DisplayName("getLeaveBalances")
    class GetLeaveBalances {

        @Test
        @DisplayName("Lấy số dư phép thành công — tự động khởi tạo nếu chưa có")
        void getLeaveBalances_Success() {
            int year = LocalDate.now().getYear();
            when(employeeRepository.existsById(1L)).thenReturn(true);
            when(leaveTypeRepository.findAll()).thenReturn(List.of(annualLeaveType));
            when(employeeRepository.findById(1L)).thenReturn(Optional.of(employee));
            when(leaveBalanceRepository.findByEmployeeIdAndLeaveTypeIdAndYear(1L, 1L, year))
                    .thenReturn(Optional.of(annualBalance));
            when(leaveBalanceRepository.findByEmployeeIdAndYear(1L, year))
                    .thenReturn(List.of(annualBalance));

            List<LeaveBalanceResponse> result = leaveService.getLeaveBalances(1L, year);

            assertThat(result).hasSize(1);
            assertThat(result.get(0).getLeaveTypeCode()).isEqualTo("ANNUAL");
        }

        @Test
        @DisplayName("Nhân viên không tồn tại → ResourceNotFoundException")
        void getLeaveBalances_EmployeeNotFound() {
            when(employeeRepository.existsById(999L)).thenReturn(false);

            assertThatThrownBy(() -> leaveService.getLeaveBalances(999L, 2026))
                    .isInstanceOf(ResourceNotFoundException.class);
        }
    }

    @Nested
    @DisplayName("createLeaveRequest")
    class CreateLeaveRequest {

        @Test
        @DisplayName("Tạo đơn xin nghỉ phép thành công")
        void createLeaveRequest_Success() {
            LeaveRequestDto request = LeaveRequestDto.builder()
                    .leaveTypeCode("ANNUAL").startDate(LocalDate.now().plusDays(1))
                    .endDate(LocalDate.now().plusDays(2)).totalDays(new BigDecimal("2")).reason("Việc cá nhân").build();

            when(employeeRepository.findById(1L)).thenReturn(Optional.of(employee));
            when(leaveTypeRepository.findByCode("ANNUAL")).thenReturn(Optional.of(annualLeaveType));
            when(leaveTypeRepository.findAll()).thenReturn(List.of(annualLeaveType));
            when(leaveBalanceRepository.findByEmployeeIdAndLeaveTypeIdAndYear(eq(1L), eq(1L), anyInt()))
                    .thenReturn(Optional.of(annualBalance));
            when(leaveRequestRepository.save(any(LeaveRequest.class))).thenAnswer(inv -> {
                LeaveRequest lr = inv.getArgument(0);
                lr.setId(1L);
                return lr;
            });

            LeaveRequestResponse result = leaveService.createLeaveRequest(1L, request, null);

            assertThat(result.getStatus()).isEqualTo("PENDING");
            assertThat(annualBalance.getPendingDays()).isEqualByComparingTo(new BigDecimal("2"));
        }

        @Test
        @DisplayName("Số ngày phép không đủ → AppException")
        void createLeaveRequest_InsufficientBalance() {
            annualBalance.setUsedDays(new BigDecimal("11"));
            annualBalance.setRemainingDays(new BigDecimal("1"));

            LeaveRequestDto request = LeaveRequestDto.builder()
                    .leaveTypeCode("ANNUAL").startDate(LocalDate.now().plusDays(1))
                    .endDate(LocalDate.now().plusDays(3)).totalDays(new BigDecimal("3")).build();

            when(employeeRepository.findById(1L)).thenReturn(Optional.of(employee));
            when(leaveTypeRepository.findByCode("ANNUAL")).thenReturn(Optional.of(annualLeaveType));
            when(leaveTypeRepository.findAll()).thenReturn(List.of(annualLeaveType));
            when(leaveBalanceRepository.findByEmployeeIdAndLeaveTypeIdAndYear(eq(1L), eq(1L), anyInt()))
                    .thenReturn(Optional.of(annualBalance));

            assertThatThrownBy(() -> leaveService.createLeaveRequest(1L, request, null))
                    .isInstanceOf(AppException.class)
                    .hasMessageContaining("không đủ");
        }
    }

    @Nested
    @DisplayName("approveLeaveRequest")
    class ApproveLeaveRequest {

        @Test
        @DisplayName("Duyệt đơn nghỉ phép → status APPROVED, balance updated")
        void approveLeaveRequest_Approved() {
            Employee manager = TestFixtures.managerEmployee();
            LeaveRequest lr = LeaveRequest.builder()
                    .id(1L).employee(employee).leaveType(annualLeaveType)
                    .startDate(LocalDate.now()).endDate(LocalDate.now().plusDays(1))
                    .totalDays(new BigDecimal("2")).status("PENDING").build();

            annualBalance.setPendingDays(new BigDecimal("2"));

            LeaveApprovalDto approval = new LeaveApprovalDto();
            approval.setStatus("APPROVED");
            approval.setManagerNote("OK");

            when(leaveRequestRepository.findById(1L)).thenReturn(Optional.of(lr));
            when(employeeRepository.findById(3L)).thenReturn(Optional.of(manager));
            when(leaveBalanceRepository.findByEmployeeIdAndLeaveTypeIdAndYear(eq(1L), eq(1L), anyInt()))
                    .thenReturn(Optional.of(annualBalance));
            when(leaveRequestRepository.save(any(LeaveRequest.class))).thenAnswer(inv -> inv.getArgument(0));

            LeaveRequestResponse result = leaveService.approveLeaveRequest(1L, approval, 3L);

            assertThat(result.getStatus()).isEqualTo("APPROVED");
            assertThat(annualBalance.getUsedDays()).isEqualByComparingTo(new BigDecimal("2"));
            assertThat(annualBalance.getPendingDays()).isEqualByComparingTo(BigDecimal.ZERO);
            verify(notificationService).createNotification(any(), eq("LEAVE_APPROVED"), any(), any(), any());
        }

        @Test
        @DisplayName("Từ chối đơn nghỉ phép → status REJECTED, pending trả lại")
        void approveLeaveRequest_Rejected() {
            Employee manager = TestFixtures.managerEmployee();
            LeaveRequest lr = LeaveRequest.builder()
                    .id(1L).employee(employee).leaveType(annualLeaveType)
                    .startDate(LocalDate.now()).endDate(LocalDate.now().plusDays(1))
                    .totalDays(new BigDecimal("2")).status("PENDING").build();

            annualBalance.setPendingDays(new BigDecimal("2"));

            LeaveApprovalDto approval = new LeaveApprovalDto();
            approval.setStatus("REJECTED");
            approval.setManagerNote("Không hợp lý");

            when(leaveRequestRepository.findById(1L)).thenReturn(Optional.of(lr));
            when(employeeRepository.findById(3L)).thenReturn(Optional.of(manager));
            when(leaveBalanceRepository.findByEmployeeIdAndLeaveTypeIdAndYear(eq(1L), eq(1L), anyInt()))
                    .thenReturn(Optional.of(annualBalance));
            when(leaveRequestRepository.save(any(LeaveRequest.class))).thenAnswer(inv -> inv.getArgument(0));

            LeaveRequestResponse result = leaveService.approveLeaveRequest(1L, approval, 3L);

            assertThat(result.getStatus()).isEqualTo("REJECTED");
            assertThat(annualBalance.getUsedDays()).isEqualByComparingTo(BigDecimal.ZERO);
            assertThat(annualBalance.getPendingDays()).isEqualByComparingTo(BigDecimal.ZERO);
        }

        @Test
        @DisplayName("Đơn đã xử lý rồi → AppException")
        void approveLeaveRequest_AlreadyProcessed() {
            LeaveRequest lr = LeaveRequest.builder().id(1L).status("APPROVED").build();

            when(leaveRequestRepository.findById(1L)).thenReturn(Optional.of(lr));

            LeaveApprovalDto approval = new LeaveApprovalDto();
            approval.setStatus("APPROVED");

            assertThatThrownBy(() -> leaveService.approveLeaveRequest(1L, approval, 3L))
                    .isInstanceOf(AppException.class)
                    .hasMessageContaining("đã được xử lý");
        }
    }

    @Nested
    @DisplayName("hrOverrideLeaveRequest")
    class HrOverride {

        @Test
        @DisplayName("HR override trạng thái trùng → AppException")
        void hrOverride_SameStatus() {
            LeaveRequest lr = LeaveRequest.builder()
                    .id(1L).employee(employee).leaveType(annualLeaveType)
                    .startDate(LocalDate.now()).endDate(LocalDate.now())
                    .totalDays(BigDecimal.ONE).status("APPROVED").build();
            Employee hr = TestFixtures.managerEmployee();

            LeaveApprovalDto approval = new LeaveApprovalDto();
            approval.setStatus("APPROVED");

            when(leaveRequestRepository.findById(1L)).thenReturn(Optional.of(lr));
            when(employeeRepository.findById(3L)).thenReturn(Optional.of(hr));

            assertThatThrownBy(() -> leaveService.hrOverrideLeaveRequest(1L, approval, 3L))
                    .isInstanceOf(AppException.class)
                    .hasMessageContaining("trùng");
        }
    }

    @Nested
    @DisplayName("getLeaveRequests")
    class GetLeaveRequests {

        @Test
        @DisplayName("Lấy danh sách đơn phép phân trang thành công")
        void getLeaveRequests_WithFilters() {
            LeaveRequest lr = LeaveRequest.builder()
                    .id(1L).employee(employee).leaveType(annualLeaveType)
                    .startDate(LocalDate.now()).endDate(LocalDate.now())
                    .totalDays(BigDecimal.ONE).status("PENDING").build();

            Page<LeaveRequest> page = new PageImpl<>(List.of(lr));
            when(leaveRequestRepository.findLeaveRequestsWithFilters(any(), any(), any(), any(), any(), any(), any()))
                    .thenReturn(page);

            PageResponse<LeaveRequestResponse> result = leaveService.getLeaveRequests(
                    null, null, null, null, null, null, PageRequest.of(0, 10));

            assertThat(result.content()).hasSize(1);
        }
    }
}
