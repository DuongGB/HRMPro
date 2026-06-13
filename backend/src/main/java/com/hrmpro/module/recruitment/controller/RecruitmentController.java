package com.hrmpro.module.recruitment.controller;

import com.hrmpro.common.dto.ApiResponse;
import com.hrmpro.module.auth.entity.UserPrincipal;
import com.hrmpro.module.employee.repository.EmployeeRepository;
import com.hrmpro.module.organization.entity.Department;
import com.hrmpro.module.organization.entity.Position;
import com.hrmpro.module.organization.repository.DepartmentRepository;
import com.hrmpro.module.organization.repository.PositionRepository;
import com.hrmpro.module.recruitment.dto.ApplicationDto;
import com.hrmpro.module.recruitment.dto.InterviewDto;
import com.hrmpro.module.recruitment.dto.JobPostingDto;
import com.hrmpro.module.recruitment.entity.Application;
import com.hrmpro.module.recruitment.entity.Interview;
import com.hrmpro.module.recruitment.entity.JobPosting;
import com.hrmpro.module.recruitment.service.RecruitmentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/recruitment")
@RequiredArgsConstructor
public class RecruitmentController {

    private final RecruitmentService recruitmentService;
    private final DepartmentRepository departmentRepository;
    private final PositionRepository positionRepository;
    private final EmployeeRepository employeeRepository;

    // ─── JOB POSTINGS ─────────────────────────────────────────────────────────────

    @GetMapping("/jobs")
    public ResponseEntity<ApiResponse<List<JobPostingDto>>> getAllJobs() {
        List<JobPostingDto> list = recruitmentService.getAllJobs().stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
        return ResponseEntity.ok(ApiResponse.ok(list));
    }

    @GetMapping("/jobs/{id}")
    public ResponseEntity<ApiResponse<JobPostingDto>> getJob(@PathVariable Long id) {
        JobPostingDto dto = convertToDto(recruitmentService.getJob(id));
        return ResponseEntity.ok(ApiResponse.ok(dto));
    }

    @PostMapping("/jobs")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'HR_ADMIN', 'HR_STAFF', 'RECRUITER')")
    public ResponseEntity<ApiResponse<JobPostingDto>> createJob(
            @Valid @RequestBody JobPostingDto dto,
            @AuthenticationPrincipal UserPrincipal principal) {
        JobPosting job = convertToEntity(dto);
        JobPosting created = recruitmentService.createJob(job, principal.getEmployeeId());
        return ResponseEntity.ok(ApiResponse.ok(convertToDto(created)));
    }

    @PutMapping("/jobs/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'HR_ADMIN', 'HR_STAFF', 'RECRUITER')")
    public ResponseEntity<ApiResponse<JobPostingDto>> updateJob(@PathVariable Long id, @Valid @RequestBody JobPostingDto dto) {
        JobPosting data = convertToEntity(dto);
        JobPosting updated = recruitmentService.updateJob(id, data);
        return ResponseEntity.ok(ApiResponse.ok(convertToDto(updated)));
    }

    // ─── APPLICATIONS ─────────────────────────────────────────────────────────────

    @GetMapping("/applications")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'HR_ADMIN', 'HR_STAFF', 'RECRUITER', 'MANAGER')")
    public ResponseEntity<ApiResponse<List<ApplicationDto>>> getApplications(@RequestParam(required = false) Long jobId) {
        List<Application> apps;
        if (jobId != null) {
            apps = recruitmentService.getApplicationsByJob(jobId);
        } else {
            apps = recruitmentService.getAllApplications();
        }
        List<ApplicationDto> list = apps.stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
        return ResponseEntity.ok(ApiResponse.ok(list));
    }

    @GetMapping("/applications/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'HR_ADMIN', 'HR_STAFF', 'RECRUITER', 'MANAGER')")
    public ResponseEntity<ApiResponse<ApplicationDto>> getApplication(@PathVariable Long id) {
        ApplicationDto dto = convertToDto(recruitmentService.getApplication(id));
        return ResponseEntity.ok(ApiResponse.ok(dto));
    }

    @PostMapping("/applications")
    public ResponseEntity<ApiResponse<ApplicationDto>> createApplication(@Valid @RequestBody ApplicationDto dto) {
        Application app = convertToEntity(dto);
        Application created = recruitmentService.createApplication(app);
        return ResponseEntity.ok(ApiResponse.ok(convertToDto(created)));
    }

    @PutMapping("/applications/{id}/stage")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'HR_ADMIN', 'HR_STAFF', 'RECRUITER', 'MANAGER')")
    public ResponseEntity<ApiResponse<ApplicationDto>> updateApplicationStage(
            @PathVariable Long id,
            @RequestParam String stage,
            @RequestParam(required = false) String rejectedReason) {
        Application updated = recruitmentService.updateApplicationStage(id, stage, rejectedReason);
        return ResponseEntity.ok(ApiResponse.ok(convertToDto(updated)));
    }

    // ─── INTERVIEWS ───────────────────────────────────────────────────────────────

    @GetMapping("/interviews")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'HR_ADMIN', 'HR_STAFF', 'RECRUITER', 'MANAGER')")
    public ResponseEntity<ApiResponse<List<InterviewDto>>> getInterviews(@RequestParam(required = false) Long applicationId) {
        List<Interview> interviews;
        if (applicationId != null) {
            interviews = recruitmentService.getInterviewsByApplication(applicationId);
        } else {
            interviews = recruitmentService.getAllInterviews();
        }
        List<InterviewDto> list = interviews.stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
        return ResponseEntity.ok(ApiResponse.ok(list));
    }

    @GetMapping("/interviews/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'HR_ADMIN', 'HR_STAFF', 'RECRUITER', 'MANAGER')")
    public ResponseEntity<ApiResponse<InterviewDto>> getInterview(@PathVariable Long id) {
        InterviewDto dto = convertToDto(recruitmentService.getInterview(id));
        return ResponseEntity.ok(ApiResponse.ok(dto));
    }

    @PostMapping("/interviews")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'HR_ADMIN', 'HR_STAFF', 'RECRUITER', 'MANAGER')")
    public ResponseEntity<ApiResponse<InterviewDto>> scheduleInterview(@RequestBody InterviewDto dto) {
        Interview interview = convertToEntity(dto);
        Interview created = recruitmentService.scheduleInterview(interview);
        return ResponseEntity.ok(ApiResponse.ok(convertToDto(created)));
    }

    @PutMapping("/interviews/{id}/result")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'HR_ADMIN', 'HR_STAFF', 'RECRUITER', 'MANAGER')")
    public ResponseEntity<ApiResponse<InterviewDto>> updateInterviewResult(
            @PathVariable Long id,
            @RequestParam String result,
            @RequestParam(required = false) String feedback) {
        Interview updated = recruitmentService.updateInterviewResult(id, result, feedback);
        return ResponseEntity.ok(ApiResponse.ok(convertToDto(updated)));
    }

    // ─── CONVERTERS ───────────────────────────────────────────────────────────────

    private JobPostingDto convertToDto(JobPosting entity) {
        return JobPostingDto.builder()
                .id(entity.getId())
                .title(entity.getTitle())
                .departmentId(entity.getDepartment() != null ? entity.getDepartment().getId() : null)
                .departmentName(entity.getDepartment() != null ? entity.getDepartment().getName() : null)
                .positionId(entity.getPosition() != null ? entity.getPosition().getId() : null)
                .positionName(entity.getPosition() != null ? entity.getPosition().getName() : null)
                .description(entity.getDescription())
                .requirements(entity.getRequirements())
                .salaryRange(entity.getSalaryRange())
                .headcount(entity.getHeadcount())
                .postingDate(entity.getPostingDate())
                .closingDate(entity.getClosingDate())
                .status(entity.getStatus())
                .createdById(entity.getCreatedBy() != null ? entity.getCreatedBy().getId() : null)
                .createdByName(entity.getCreatedBy() != null ? entity.getCreatedBy().getFullName() : null)
                .build();
    }

    private JobPosting convertToEntity(JobPostingDto dto) {
        Department dept = null;
        if (dto.getDepartmentId() != null) {
            dept = departmentRepository.findById(dto.getDepartmentId()).orElse(null);
        }
        Position pos = null;
        if (dto.getPositionId() != null) {
            pos = positionRepository.findById(dto.getPositionId()).orElse(null);
        }
        return JobPosting.builder()
                .id(dto.getId())
                .title(dto.getTitle())
                .department(dept)
                .position(pos)
                .description(dto.getDescription())
                .requirements(dto.getRequirements())
                .salaryRange(dto.getSalaryRange())
                .headcount(dto.getHeadcount())
                .postingDate(dto.getPostingDate())
                .closingDate(dto.getClosingDate())
                .status(dto.getStatus())
                .build();
    }

    private ApplicationDto convertToDto(Application entity) {
        return ApplicationDto.builder()
                .id(entity.getId())
                .jobPostingId(entity.getJobPosting() != null ? entity.getJobPosting().getId() : null)
                .jobPostingTitle(entity.getJobPosting() != null ? entity.getJobPosting().getTitle() : null)
                .candidateName(entity.getCandidateName())
                .candidateEmail(entity.getCandidateEmail())
                .candidatePhone(entity.getCandidatePhone())
                .cvUrl(entity.getCvUrl())
                .coverLetter(entity.getCoverLetter())
                .source(entity.getSource())
                .stage(entity.getStage())
                .rejectedReason(entity.getRejectedReason())
                .appliedAt(entity.getAppliedAt())
                .updatedAt(entity.getUpdatedAt())
                .build();
    }

    private Application convertToEntity(ApplicationDto dto) {
        JobPosting job = null;
        if (dto.getJobPostingId() != null) {
            job = recruitmentService.getJob(dto.getJobPostingId());
        }
        return Application.builder()
                .id(dto.getId())
                .jobPosting(job)
                .candidateName(dto.getCandidateName())
                .candidateEmail(dto.getCandidateEmail())
                .candidatePhone(dto.getCandidatePhone())
                .cvUrl(dto.getCvUrl())
                .coverLetter(dto.getCoverLetter())
                .source(dto.getSource())
                .stage(dto.getStage())
                .rejectedReason(dto.getRejectedReason())
                .appliedAt(dto.getAppliedAt())
                .updatedAt(dto.getUpdatedAt())
                .build();
    }

    private InterviewDto convertToDto(Interview entity) {
        String names = "";
        if (entity.getInterviewers() != null && !entity.getInterviewers().trim().isEmpty()) {
            try {
                List<Long> ids = Arrays.stream(entity.getInterviewers().split(","))
                        .map(String::trim)
                        .map(Long::parseLong)
                        .collect(Collectors.toList());
                names = employeeRepository.findAllById(ids).stream()
                        .map(com.hrmpro.module.employee.entity.Employee::getFullName)
                        .collect(Collectors.joining(", "));
            } catch (Exception e) {
                // ignore
            }
        }

        return InterviewDto.builder()
                .id(entity.getId())
                .applicationId(entity.getApplication() != null ? entity.getApplication().getId() : null)
                .candidateName(entity.getApplication() != null ? entity.getApplication().getCandidateName() : null)
                .jobPostingTitle(entity.getApplication() != null && entity.getApplication().getJobPosting() != null 
                        ? entity.getApplication().getJobPosting().getTitle() : null)
                .round(entity.getRound())
                .interviewType(entity.getInterviewType())
                .scheduledAt(entity.getScheduledAt())
                .durationMinutes(entity.getDurationMinutes())
                .location(entity.getLocation())
                .meetingUrl(entity.getMeetingUrl())
                .interviewers(entity.getInterviewers())
                .interviewerNames(names)
                .result(entity.getResult())
                .feedback(entity.getFeedback())
                .build();
    }

    private Interview convertToEntity(InterviewDto dto) {
        Application app = null;
        if (dto.getApplicationId() != null) {
            app = recruitmentService.getApplication(dto.getApplicationId());
        }
        return Interview.builder()
                .id(dto.getId())
                .application(app)
                .round(dto.getRound())
                .interviewType(dto.getInterviewType())
                .scheduledAt(dto.getScheduledAt())
                .durationMinutes(dto.getDurationMinutes())
                .location(dto.getLocation())
                .meetingUrl(dto.getMeetingUrl())
                .interviewers(dto.getInterviewers())
                .result(dto.getResult())
                .feedback(dto.getFeedback())
                .build();
    }
}
