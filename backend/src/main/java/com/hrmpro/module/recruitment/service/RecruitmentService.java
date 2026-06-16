package com.hrmpro.module.recruitment.service;

import com.hrmpro.common.service.EmailService;
import com.hrmpro.module.employee.entity.Employee;
import com.hrmpro.module.recruitment.enums.InterviewType;
import com.hrmpro.module.recruitment.enums.InterviewResult;
import com.hrmpro.module.recruitment.enums.InterviewApprovalStatus;
import com.hrmpro.module.employee.repository.EmployeeRepository;
import com.hrmpro.module.employee.service.NotificationService;
import com.hrmpro.module.notification.service.RealtimeNotificationService;
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
    private final NotificationService notificationService;
    private final RealtimeNotificationService realtimeNotificationService;

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
        if ("REJECTED".equals(stage)) {
            app.setRejectedReason(rejectedReason);
        }
        app.setUpdatedAt(LocalDateTime.now());
        Application saved = applicationRepository.save(app);

        // Phát tín hiệu Kanban qua WebSocket
        java.util.Map<String, Object> payload = new java.util.HashMap<>();
        payload.put("id", saved.getId());
        payload.put("jobId", saved.getJobPosting().getId());
        payload.put("stage", saved.getStage());
        realtimeNotificationService.broadcastKanbanUpdate(payload);

        return saved;
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
        interview.setApprovalStatus(InterviewApprovalStatus.PENDING);
        interview.setCreatedAt(LocalDateTime.now());

        Interview saved = interviewRepository.save(interview);

        // Tìm manager của recruiter để gửi thông báo duyệt
        Employee recruiter = app.getJobPosting().getCreatedBy();
        if (recruiter != null) {
            if (recruiter.getManager() != null) {
                notificationService.createNotification(
                        recruiter.getManager(),
                        "INTERVIEW_PENDING",
                        "Yêu cầu duyệt lịch phỏng vấn mới",
                        "Cần duyệt lịch phỏng vấn vòng " + interview.getRound() + " cho ứng viên " + app.getCandidateName(),
                        "/recruitment"
                );
            } else {
                // Broadcast nếu không tìm thấy manager
                realtimeNotificationService.broadcastNotification(
                        com.hrmpro.module.notification.dto.NotificationResponse.builder()
                                .title("Yêu cầu duyệt lịch phỏng vấn mới")
                                .message("Cần duyệt lịch phỏng vấn vòng " + interview.getRound() + " cho ứng viên " + app.getCandidateName())
                                .type("INTERVIEW_PENDING")
                                .build()
                );
            }
            // Thông báo lại cho chính người tạo để có trải nghiệm realtime
            notificationService.createNotification(
                    recruiter,
                    "INTERVIEW_CREATED",
                    "Đã lên lịch phỏng vấn",
                    "Bạn đã tạo lịch phỏng vấn vòng " + interview.getRound() + " cho ứng viên " + app.getCandidateName() + ". Vui lòng chờ duyệt.",
                    "/recruitment"
            );
        }

        // Gửi email thông báo cho Manager để duyệt lịch
        sendPendingApprovalEmail(interview);

        return saved;
    }

    @Transactional
    public Interview approveInterviewSchedule(Long id, InterviewApprovalStatus status, String feedback, Long approverEmployeeId, boolean isSystemAdmin) {
        Interview interview = getInterview(id);

        // Kiểm tra quyền phê duyệt lịch phỏng vấn: Phải là Admin hoặc là một trong các Interviewers
        if (!isSystemAdmin) {
            String interviewersStr = interview.getInterviewers();
            if (interviewersStr == null || interviewersStr.trim().isEmpty()) {
                throw new RuntimeException("Lịch phỏng vấn chưa được phân công người phỏng vấn.");
            }

            String cleanInterviewers = interviewersStr
                    .replace("[", "")
                    .replace("]", "")
                    .replace("\"", "")
                    .replace("'", "")
                    .trim();

            List<Long> interviewerIds = Arrays.stream(cleanInterviewers.split(","))
                    .map(String::trim)
                    .filter(s -> !s.isEmpty() && s.matches("\\d+"))
                    .map(Long::parseLong)
                    .collect(Collectors.toList());

            if (!interviewerIds.contains(approverEmployeeId)) {
                throw new RuntimeException("Bạn không được phân công phỏng vấn lịch này, không có quyền phê duyệt.");
            }
        }

        interview.setApprovalStatus(status);
        interview.setApprovalFeedback(feedback);
        interview.setApprovedAt(LocalDateTime.now());

        if (InterviewApprovalStatus.APPROVED == status) {
            // Gửi thư mời cho ứng viên và người phỏng vấn sau khi được duyệt
            sendInterviewEmails(interview);
        } else if (InterviewApprovalStatus.REJECTED == status) {
            // Thông báo cho Recruiter biết lịch bị từ chối
            sendRejectedNotificationToRecruiter(interview);
        }
        
        Interview saved = interviewRepository.save(interview);

        // Phát tín hiệu realtime WebSocket cho Client
        java.util.Map<String, Object> wsPayload = new java.util.HashMap<>();
        wsPayload.put("id", saved.getId());
        wsPayload.put("approvalStatus", saved.getApprovalStatus().toString());
        realtimeNotificationService.broadcastInterviewApprovalUpdate(wsPayload);

        // Thông báo lại cho Recruiter
        Employee recruiter = interview.getApplication().getJobPosting().getCreatedBy();
        if (recruiter != null) {
            notificationService.createNotification(
                    recruiter,
                    "INTERVIEW_APPROVAL_RESULT",
                    "Kết quả duyệt lịch phỏng vấn",
                    "Lịch phỏng vấn ứng viên " + interview.getApplication().getCandidateName() + 
                    " đã bị " + (status == InterviewApprovalStatus.APPROVED ? "duyệt" : "từ chối") + ".\n" +
                    (feedback != null ? "Phản hồi: " + feedback : ""),
                    "/recruitment"
            );
        } else {
            // Broadcast nếu không có recruiter
            realtimeNotificationService.broadcastNotification(
                    com.hrmpro.module.notification.dto.NotificationResponse.builder()
                            .title("Kết quả duyệt lịch phỏng vấn")
                            .message("Lịch phỏng vấn ứng viên " + interview.getApplication().getCandidateName() + 
                                     " đã bị " + (status == InterviewApprovalStatus.APPROVED ? "duyệt" : "từ chối") + ".")
                            .type("INTERVIEW_APPROVAL_RESULT")
                            .build()
            );
        }

        return saved;
    }

    @Transactional
    public Interview updateInterviewResult(Long id, InterviewResult result, String feedback) {
        Interview interview = getInterview(id);
        interview.setResult(result);
        interview.setFeedback(feedback);

        // Đồng thời cập nhật trạng thái của ứng viên nếu phỏng vấn tạch/đậu
        if (InterviewResult.PASSED == result) {
            interview.getApplication().setStage("OFFER");
        } else if (InterviewResult.FAILED == result) {
            interview.getApplication().setStage("REJECTED");
            interview.getApplication().setRejectedReason("Không đạt phỏng vấn vòng " + interview.getRound());
        }
        applicationRepository.save(interview.getApplication());

        return interviewRepository.save(interview);
    }

    private void sendPendingApprovalEmail(Interview interview) {
        Application app = interview.getApplication();
        JobPosting job = app.getJobPosting();
        if (job.getDepartment() != null && job.getDepartment().getManagerId() != null) {
            employeeRepository.findById(job.getDepartment().getManagerId()).ifPresent(manager -> {
                DateTimeFormatter formatter = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");
                String timeStr = interview.getScheduledAt().format(formatter);

                String subject = "[HRMPro] Yêu cầu phê duyệt lịch phỏng vấn ứng viên " + app.getCandidateName();
                String content = String.format(
                        "Kính chào Anh/Chị %s,\n\n" +
                        "Hệ thống HRMPro ghi nhận một yêu cầu phê duyệt lịch phỏng vấn mới từ Recruiter:\n\n" +
                        "Thông tin buổi phỏng vấn:\n" +
                        "- Ứng viên: %s\n" +
                        "- Vị trí: %s\n" +
                        "- Phòng ban: %s\n" +
                        "- Vòng: %d\n" +
                        "- Thời gian đề xuất: %s\n" +
                        "- Hình thức: %s\n" +
                        "- Địa điểm/Link họp: %s\n\n" +
                        "Vui lòng đăng nhập vào hệ thống để xem chi tiết và phê duyệt (Đồng ý hoặc Từ chối lịch).\n\n" +
                        "Trân trọng,\n" +
                        "Hệ thống HRMPro",
                        manager.getFullName(), app.getCandidateName(), job.getTitle(),
                        job.getDepartment().getName(), interview.getRound(), timeStr,
                        interview.getInterviewType(), interview.getLocation() != null ? interview.getLocation() : interview.getMeetingUrl()
                );
                emailService.sendEmail(manager.getEmail(), subject, content);
            });
        }
    }

    private void sendRejectedNotificationToRecruiter(Interview interview) {
        Application app = interview.getApplication();
        JobPosting job = app.getJobPosting();
        if (job.getCreatedBy() != null) {
            Employee recruiter = job.getCreatedBy();
            DateTimeFormatter formatter = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");
            String timeStr = interview.getScheduledAt().format(formatter);

            String subject = "[HRMPro] Lịch phỏng vấn bị từ chối - Ứng viên " + app.getCandidateName();
            String content = String.format(
                    "Xin chào %s,\n\n" +
                    "Lịch phỏng vấn do bạn đề xuất cho ứng viên %s vào lúc %s đã bị từ chối bởi Manager.\n\n" +
                    "Lý do từ chối/Phản hồi:\n" +
                    "\"%s\"\n\n" +
                    "Vui lòng trao đổi lại và thực hiện lên lịch phỏng vấn mới trên hệ thống.\n\n" +
                    "Trân trọng,\n" +
                    "Hệ thống HRMPro",
                    recruiter.getFullName(), app.getCandidateName(), timeStr,
                    interview.getApprovalFeedback() != null ? interview.getApprovalFeedback() : "Không có lý do chi tiết."
            );
            emailService.sendEmail(recruiter.getEmail(), subject, content);
        }
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
            List<Long> interviewerIds = new ArrayList<>();
            try {
                String rawInterviewers = interview.getInterviewers()
                        .replace("[", "")
                        .replace("]", "")
                        .replace("\"", "")
                        .replace("'", "")
                        .trim();

                interviewerIds = Arrays.stream(rawInterviewers.split(","))
                        .map(String::trim)
                        .filter(s -> !s.isEmpty() && s.matches("\\d+"))
                        .map(Long::parseLong)
                        .collect(Collectors.toList());
            } catch (Exception e) {
                log.error("Lỗi khi parse danh sách ID người phỏng vấn từ chuỗi '{}': {}", interview.getInterviewers(), e.getMessage());
            }

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
