package com.hrmpro.module.recruitment.dto;

import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InterviewDto {
    private Long id;
    private Long applicationId;
    private String candidateName;
    private String jobPostingTitle;
    private Integer round;
    private String interviewType; // PHONE|ONLINE|ONSITE|TECHNICAL
    private LocalDateTime scheduledAt;
    private Integer durationMinutes;
    private String location;
    private String meetingUrl;
    private String interviewers; // Chuỗi ID người phỏng vấn, ví dụ "1,2"
    private String interviewerNames; // Tên hiển thị của người phỏng vấn
    private String result; // PASSED|FAILED|NO_SHOW|RESCHEDULED
    private String feedback;
    private String approvalStatus;
    private String approvalFeedback;
}
