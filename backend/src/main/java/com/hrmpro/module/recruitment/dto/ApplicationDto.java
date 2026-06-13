package com.hrmpro.module.recruitment.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ApplicationDto {
    private Long id;
    private Long jobPostingId;
    private String jobPostingTitle;

    @NotBlank(message = "Tên ứng viên không được để trống")
    private String candidateName;

    private String candidateEmail;
    private String candidatePhone;
    private String cvUrl;
    private String coverLetter;
    private String source; // LINKEDIN|INDEED|REFERRAL|WEBSITE
    private String stage; // NEW|SCREENING|INTERVIEW|OFFER|HIRED|REJECTED
    private String rejectedReason;
    private LocalDateTime appliedAt;
    private LocalDateTime updatedAt;
}
