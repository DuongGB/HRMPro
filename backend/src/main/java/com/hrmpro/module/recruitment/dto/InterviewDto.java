package com.hrmpro.module.recruitment.dto;

import com.hrmpro.module.recruitment.enums.InterviewType;
import com.hrmpro.module.recruitment.enums.InterviewResult;
import com.hrmpro.module.recruitment.enums.InterviewApprovalStatus;
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
    private InterviewType interviewType;
    private LocalDateTime scheduledAt;
    private Integer durationMinutes;
    private String location;
    private String meetingUrl;
    private String interviewers;
    private String interviewerNames; 
    private InterviewResult result; 
    private String feedback;
    private InterviewApprovalStatus approvalStatus;
    private String approvalFeedback;
}
