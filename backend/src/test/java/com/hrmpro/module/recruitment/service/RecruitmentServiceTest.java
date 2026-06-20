package com.hrmpro.module.recruitment.service;

import com.hrmpro.common.service.EmailService;
import com.hrmpro.module.employee.entity.Employee;
import com.hrmpro.module.employee.repository.EmployeeRepository;
import com.hrmpro.module.employee.service.NotificationService;
import com.hrmpro.module.notification.service.RealtimeNotificationService;
import com.hrmpro.module.organization.entity.Department;
import com.hrmpro.module.recruitment.entity.Application;
import com.hrmpro.module.recruitment.entity.Interview;
import com.hrmpro.module.recruitment.entity.JobPosting;
import com.hrmpro.module.recruitment.enums.InterviewApprovalStatus;
import com.hrmpro.module.recruitment.enums.InterviewResult;
import com.hrmpro.module.recruitment.enums.InterviewType;
import com.hrmpro.module.recruitment.repository.ApplicationRepository;
import com.hrmpro.module.recruitment.repository.InterviewRepository;
import com.hrmpro.module.recruitment.repository.JobPostingRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("RecruitmentService Unit Tests")
class RecruitmentServiceTest {

    @Mock private JobPostingRepository jobPostingRepository;
    @Mock private ApplicationRepository applicationRepository;
    @Mock private InterviewRepository interviewRepository;
    @Mock private EmployeeRepository employeeRepository;
    @Mock private EmailService emailService;
    @Mock private NotificationService notificationService;
    @Mock private RealtimeNotificationService realtimeNotificationService;

    @InjectMocks
    private RecruitmentService recruitmentService;

    @Test
    @DisplayName("createJob — thành công")
    void createJob_Success() {
        Employee creator = Employee.builder().id(1L).firstName("Recruiter").build();
        JobPosting job = JobPosting.builder().title("Java Dev").build();

        when(employeeRepository.findById(1L)).thenReturn(Optional.of(creator));
        when(jobPostingRepository.save(any(JobPosting.class))).thenAnswer(i -> i.getArgument(0));

        JobPosting result = recruitmentService.createJob(job, 1L);

        assertThat(result.getTitle()).isEqualTo("Java Dev");
        assertThat(result.getCreatedBy()).isEqualTo(creator);
        verify(jobPostingRepository).save(job);
    }

    @Test
    @DisplayName("updateApplicationStage — đổi stage thành công và phát tin realtime")
    void updateApplicationStage_Success() {
        JobPosting job = JobPosting.builder().id(10L).build();
        Application app = Application.builder()
                .id(100L)
                .candidateName("John Doe")
                .jobPosting(job)
                .stage("SCREENING")
                .build();

        when(applicationRepository.findById(100L)).thenReturn(Optional.of(app));
        when(applicationRepository.save(any(Application.class))).thenAnswer(i -> i.getArgument(0));

        Application result = recruitmentService.updateApplicationStage(100L, "REJECTED", "Không đạt yêu cầu");

        assertThat(result.getStage()).isEqualTo("REJECTED");
        assertThat(result.getRejectedReason()).isEqualTo("Không đạt yêu cầu");
        verify(realtimeNotificationService).broadcastKanbanUpdate(any());
        verify(applicationRepository).save(app);
    }

    @Test
    @DisplayName("scheduleInterview — lên lịch phỏng vấn thành công và gửi thông báo, email phê duyệt")
    void scheduleInterview_Success() {
        Employee manager = Employee.builder().id(2L).firstName("Manager").email("manager@mail.com").build();
        Employee recruiter = Employee.builder().id(1L).firstName("Recruiter").email("recruiter@mail.com").manager(manager).build();
        Department dept = Department.builder().id(5L).name("IT").managerId(2L).build();
        JobPosting job = JobPosting.builder().id(10L).createdBy(recruiter).department(dept).build();
        Application app = Application.builder().id(100L).candidateName("John").jobPosting(job).build();

        Interview interview = Interview.builder()
                .id(200L)
                .application(app)
                .round(1)
                .scheduledAt(LocalDateTime.of(2026, 6, 25, 10, 0))
                .interviewType(InterviewType.ONLINE)
                .meetingUrl("http://meet.google.com")
                .build();

        when(applicationRepository.findById(100L)).thenReturn(Optional.of(app));
        when(interviewRepository.save(any(Interview.class))).thenAnswer(i -> i.getArgument(0));
        when(employeeRepository.findById(2L)).thenReturn(Optional.of(manager));

        Interview result = recruitmentService.scheduleInterview(interview);

        assertThat(result.getApprovalStatus()).isEqualTo(InterviewApprovalStatus.PENDING);
        verify(notificationService).createNotification(eq(manager), eq("INTERVIEW_PENDING"), anyString(), anyString(), anyString());
        verify(notificationService).createNotification(eq(recruiter), eq("INTERVIEW_CREATED"), anyString(), anyString(), anyString());
        verify(emailService).sendEmail(eq("manager@mail.com"), contains("Yêu cầu phê duyệt"), anyString());
    }

    @Test
    @DisplayName("approveInterviewSchedule — duyệt lịch phỏng vấn thành công (APPROVED)")
    void approveInterviewSchedule_Approved() {
        Employee interviewer = Employee.builder().id(15L).firstName("Interviewer").email("interviewer@mail.com").build();
        JobPosting job = JobPosting.builder().id(10L).title("Java Dev").build();
        Application app = Application.builder().id(100L).candidateName("John").candidateEmail("john@mail.com").jobPosting(job).build();

        Interview interview = Interview.builder()
                .id(200L)
                .application(app)
                .round(1)
                .scheduledAt(LocalDateTime.of(2026, 6, 25, 10, 0))
                .interviewType(InterviewType.ONLINE)
                .meetingUrl("http://meet.google.com")
                .interviewers("[\"15\"]") // Interviewer ID là 15
                .approvalStatus(InterviewApprovalStatus.PENDING)
                .build();

        when(interviewRepository.findById(200L)).thenReturn(Optional.of(interview));
        when(employeeRepository.findById(15L)).thenReturn(Optional.of(interviewer));
        when(interviewRepository.save(any(Interview.class))).thenAnswer(i -> i.getArgument(0));

        Interview result = recruitmentService.approveInterviewSchedule(
                200L, InterviewApprovalStatus.APPROVED, "Lịch OK", 15L, false
        );

        assertThat(result.getApprovalStatus()).isEqualTo(InterviewApprovalStatus.APPROVED);
        // Gửi email cho ứng viên và người phỏng vấn
        verify(emailService).sendEmail(eq("john@mail.com"), contains("Thư mời tham gia phỏng vấn"), anyString());
        verify(emailService).sendEmail(eq("interviewer@mail.com"), contains("Lịch phỏng vấn ứng viên"), anyString());
        verify(realtimeNotificationService).broadcastInterviewApprovalUpdate(any());
    }

    @Test
    @DisplayName("approveInterviewSchedule — người phê duyệt không nằm trong danh sách interviewers → ném ngoại lệ")
    void approveInterviewSchedule_UnauthorizedApprover_ThrowsException() {
        Interview interview = Interview.builder()
                .id(200L)
                .interviewers("[\"15\"]") // Chỉ ID 15 được phỏng vấn
                .build();

        when(interviewRepository.findById(200L)).thenReturn(Optional.of(interview));

        assertThatThrownBy(() -> recruitmentService.approveInterviewSchedule(
                200L, InterviewApprovalStatus.APPROVED, "Phê duyệt lỗi", 99L, false
        ))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("Bạn không được phân công phỏng vấn lịch này");
    }

    @Test
    @DisplayName("updateInterviewResult — ứng viên đạt phỏng vấn → stage sang OFFER")
    void updateInterviewResult_Passed() {
        Application app = Application.builder().id(100L).stage("INTERVIEW").build();
        Interview interview = Interview.builder()
                .id(200L)
                .application(app)
                .round(1)
                .build();

        when(interviewRepository.findById(200L)).thenReturn(Optional.of(interview));
        when(interviewRepository.save(any(Interview.class))).thenAnswer(i -> i.getArgument(0));

        Interview result = recruitmentService.updateInterviewResult(200L, InterviewResult.PASSED, "Tốt lắm");

        assertThat(result.getResult()).isEqualTo(InterviewResult.PASSED);
        assertThat(app.getStage()).isEqualTo("OFFER");
        verify(applicationRepository).save(app);
    }
}
