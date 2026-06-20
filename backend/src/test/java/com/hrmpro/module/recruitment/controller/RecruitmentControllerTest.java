package com.hrmpro.module.recruitment.controller;

import com.hrmpro.config.TestSecurityConfig;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.hrmpro.config.SecurityConfig;
import com.hrmpro.config.HrmSecurityEvaluator;
import com.hrmpro.module.auth.entity.UserPrincipal;
import com.hrmpro.module.recruitment.dto.ApplicationDto;
import com.hrmpro.module.recruitment.dto.InterviewDto;
import com.hrmpro.module.recruitment.dto.JobPostingDto;
import com.hrmpro.module.recruitment.entity.Application;
import com.hrmpro.module.recruitment.entity.Interview;
import com.hrmpro.module.recruitment.entity.JobPosting;
import com.hrmpro.module.employee.entity.Employee;
import com.hrmpro.module.recruitment.enums.InterviewApprovalStatus;
import com.hrmpro.module.recruitment.enums.InterviewType;
import com.hrmpro.module.recruitment.service.RecruitmentService;
import com.hrmpro.module.employee.repository.EmployeeRepository;
import com.hrmpro.module.organization.repository.DepartmentRepository;
import com.hrmpro.module.organization.repository.PositionRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(RecruitmentController.class)
@Import({SecurityConfig.class, TestSecurityConfig.class})
@ActiveProfiles("test")
@DisplayName("RecruitmentController Integration Tests (MockMvc)")
class RecruitmentControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean private RecruitmentService recruitmentService;
    @MockBean private DepartmentRepository departmentRepository;
    @MockBean private PositionRepository positionRepository;
    @MockBean private EmployeeRepository employeeRepository;


    @MockBean(name = "hrmSecurity") private HrmSecurityEvaluator hrmSecurity;


    @Test
    @DisplayName("GET /api/v1/recruitment/jobs — lấy danh sách tin tuyển dụng công khai → 200")
    void getAllJobs_Success() throws Exception {
        JobPosting job = JobPosting.builder().id(1L).title("Java Developer").status("OPEN").build();
        when(recruitmentService.getAllJobs()).thenReturn(List.of(job));

        mockMvc.perform(get("/api/v1/recruitment/jobs"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data[0].title").value("Java Developer"));
    }

    @Test
    @DisplayName("POST /api/v1/recruitment/applications — tạo application công khai → 200")
    void createApplication_Success() throws Exception {
        ApplicationDto dto = ApplicationDto.builder()
                .jobPostingId(1L)
                .candidateName("John Doe")
                .candidateEmail("john@mail.com")
                .build();

        JobPosting job = JobPosting.builder().id(1L).title("Java Dev").build();
        Application app = Application.builder()
                .id(100L)
                .jobPosting(job)
                .candidateName("John Doe")
                .candidateEmail("john@mail.com")
                .build();

        when(recruitmentService.createApplication(any(Application.class))).thenReturn(app);

        mockMvc.perform(post("/api/v1/recruitment/applications")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto))
                        .with(csrf()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.candidateName").value("John Doe"));
    }

    @Test
    @DisplayName("PUT /api/v1/recruitment/interviews/{id}/approve — phê duyệt lịch phỏng vấn → 200")
    void approveInterviewSchedule_Success() throws Exception {
        UserPrincipal principal = UserPrincipal.builder()
                .id(1L)
                .username("manager1")
                .employeeId(15L)
                .isActive(true)
                .authorities(List.of(new SimpleGrantedAuthority("ROLE_MANAGER")))
                .build();

        Application app = Application.builder().id(100L).candidateName("John Doe").build();
        Interview interview = Interview.builder()
                .id(200L)
                .application(app)
                .round(1)
                .scheduledAt(LocalDateTime.of(2026, 6, 25, 10, 0))
                .interviewType(InterviewType.ONLINE)
                .approvalStatus(InterviewApprovalStatus.APPROVED)
                .build();

        when(recruitmentService.approveInterviewSchedule(eq(200L), eq(InterviewApprovalStatus.APPROVED), eq("Lịch OK"), eq(15L), eq(false)))
                .thenReturn(interview);

        mockMvc.perform(put("/api/v1/recruitment/interviews/200/approve")
                        .param("status", "APPROVED")
                        .param("feedback", "Lịch OK")
                        .with(user(principal))
                        .with(csrf()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.approvalStatus").value("APPROVED"));
    }
}
