package com.hrmpro.module.recruitment.service;

import com.hrmpro.common.service.EmailService;
import com.hrmpro.module.employee.entity.Employee;
import com.hrmpro.module.employee.repository.EmployeeRepository;
import com.hrmpro.module.organization.entity.Department;
import com.hrmpro.module.organization.entity.Position;
import com.hrmpro.module.recruitment.entity.Application;
import com.hrmpro.module.recruitment.entity.Interview;
import com.hrmpro.module.recruitment.entity.JobPosting;
import com.hrmpro.module.recruitment.repository.ApplicationRepository;
import com.hrmpro.module.recruitment.repository.InterviewRepository;
import com.hrmpro.module.recruitment.repository.JobPostingRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class RecruitmentService {

    private final JobPostingRepository jobPostingRepository;
    private final ApplicationRepository applicationRepository;
    private final InterviewRepository interviewRepository;
    private final EmployeeRepository employeeRepository;
    private final EmailService emailService;

    // ─── JOB POSTINGS LOGIC ───────────────────────────────────────────────────────

    public List<JobPosting> getAllJobs() {
        return jobPostingRepository.findAllByOrderByCreatedAtDesc();
    }

    public JobPosting getJob(Long id) {
        return jobPostingRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy tin tuyển dụng ID: " + id));
    }

    @Transactional
    public JobPosting createJob(JobPosting job, Long createdById) {
        Employee creator = employeeRepository.findById(createdById)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người tạo ID: " + createdById));
        job.setCreatedBy(creator);
        job.setCreatedAt(LocalDateTime.now());
        return jobPostingRepository.save(job);
    }

    @Transactional
    public JobPosting updateJob(Long id, JobPosting data) {
        JobPosting job = getJob(id);
        job.setTitle(data.getTitle());
        job.setDescription(data.getDescription());
        job.setRequirements(data.getRequirements());
        job.setSalaryRange(data.getSalaryRange());
        job.setHeadcount(data.getHeadcount());
        job.setClosingDate(data.getClosingDate());
        job.setStatus(data.getStatus());
        return jobPostingRepository.save(job);
    }

    // ─── APPLICATIONS LOGIC ───────────────────────────────────────────────────────

    public List<Application> getApplicationsByJob(Long jobId) {
        return applicationRepository.findByJobPostingId(jobId);
    }

    public List<Application> getAllApplications() {
        return applicationRepository.findAllByOrderByAppliedAtDesc();
    }

    public Application getApplication(Long id) {
        return applicationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy hồ sơ ứng viên ID: " + id));
    }

    @Transactional
    public Application createApplication(Application app) {
        JobPosting job = jobPostingRepository.findById(app.getJobPosting().getId())
                .orElseThrow(() -> new RuntimeException("Không tìm thấy tin tuyển dụng ID: " + app.getJobPosting().getId()));
        app.setJobPosting(job);
        app.setAppliedAt(LocalDateTime.now());
        app.setUpdatedAt(LocalDateTime.now());
        return applicationRepository.save(app);
    }

    @Transactional
    public Application updateApplicationStage(Long id, String stage, String rejectedReason) {
        Application app = getApplication(id);
        app.setStage(stage);
        app.setRejectedReason(rejectedReason);
        app.setUpdatedAt(LocalDateTime.now());
        return applicationRepository.save(app);
    }

    // ─── INTERVIEWS LOGIC ─────────────────────────────────────────────────────────

    public List<Interview> getInterviewsByApplication(Long applicationId) {
        return interviewRepository.findByApplicationId(applicationId);
    }

    public List<Interview> getAllInterviews() {
        return interviewRepository.findAllByOrderByScheduledAtDesc();
    }

    public Interview getInterview(Long id) {
        return interviewRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy lịch phỏng vấn ID: " + id));
    }

    @Transactional
    public Interview scheduleInterview(Interview interview) {
        Application app = getApplication(interview.getApplication().getId());
        interview.setApplication(app);
        interview.setCreatedAt(LocalDateTime.now());

        interview = interviewRepository.save(interview);

        // Tự động gửi email thông báo phỏng vấn
        sendInterviewEmails(interview);

        return interview;
    }

    @Transactional
    public Interview updateInterviewResult(Long id, String result, String feedback) {
        Interview interview = getInterview(id);
        interview.setResult(result);
        interview.setFeedback(feedback);

        // Đồng thời cập nhật trạng thái của ứng viên nếu phỏng vấn tạch/đậu
        if ("PASSED".equals(result)) {
            interview.getApplication().setStage("OFFER");
        } else if ("FAILED".equals(result)) {
            interview.getApplication().setStage("REJECTED");
            interview.getApplication().setRejectedReason("Không đạt phỏng vấn vòng " + interview.getRound());
        }
        applicationRepository.save(interview.getApplication());

        return interviewRepository.save(interview);
    }

    private void sendInterviewEmails(Interview interview) {
        Application app = interview.getApplication();
        JobPosting job = app.getJobPosting();

        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");
        String timeStr = interview.getScheduledAt().format(formatter);

        // 1. Gửi email cho ứng viên
        String candidateSubject = "[HRMPro] Thư mời tham gia phỏng vấn vị trí " + job.getTitle();
        String candidateContent = String.format(
                "Xin chào %s,\n\n" +
                "Phòng Nhân sự công ty HRMPro trân trọng mời bạn tham gia vòng phỏng vấn cho vị trí %s.\n\n" +
                "Thông tin chi tiết buổi phỏng vấn:\n" +
                "- Vòng: %d\n" +
                "- Hình thức: %s\n" +
                "- Thời gian: %s\n" +
                "- Địa điểm/Link họp: %s\n\n" +
                "Vui lòng phản hồi email này để xác nhận sự tham gia của bạn.\n\n" +
                "Trân trọng,\n" +
                "Phòng Tuyển dụng HRMPro",
                app.getCandidateName(), job.getTitle(), interview.getRound(),
                interview.getInterviewType(), timeStr, interview.getLocation() != null ? interview.getLocation() : interview.getMeetingUrl()
        );
        emailService.sendEmail(app.getCandidateEmail(), candidateSubject, candidateContent);

        // 2. Gửi email cho những người phỏng vấn (Interviewers)
        if (interview.getInterviewers() != null && !interview.getInterviewers().trim().isEmpty()) {
            List<Long> interviewerIds = Arrays.stream(interview.getInterviewers().split(","))
                    .map(String::trim)
                    .map(Long::parseLong)
                    .collect(Collectors.toList());

            for (Long empId : interviewerIds) {
                employeeRepository.findById(empId).ifPresent(emp -> {
                    String interviewerSubject = "[HRMPro] Lịch phỏng vấn ứng viên " + app.getCandidateName() + " - Vị trí " + job.getTitle();
                    String interviewerContent = String.format(
                            "Kính chào Anh/Chị %s,\n\n" +
                            "Anh/Chị có một lịch phỏng vấn ứng viên trên hệ thống HRMPro:\n\n" +
                            "Thông tin chi tiết:\n" +
                            "- Ứng viên: %s\n" +
                            "- Vị trí: %s\n" +
                            "- Vòng: %d\n" +
                            "- Thời gian: %s\n" +
                            "- Hình thức: %s\n" +
                            "- Địa điểm/Link họp: %s\n\n" +
                            "Vui lòng truy cập hệ thống để điền nhận xét và đánh giá sau khi hoàn thành buổi phỏng vấn.\n\n" +
                            "Trân trọng,\n" +
                            "Hệ thống HRMPro",
                            emp.getFullName(), app.getCandidateName(), job.getTitle(),
                            interview.getRound(), timeStr, interview.getInterviewType(),
                            interview.getLocation() != null ? interview.getLocation() : interview.getMeetingUrl()
                    );
                    emailService.sendEmail(emp.getEmail(), interviewerSubject, interviewerContent);
                });
            }
        }
    }
}
