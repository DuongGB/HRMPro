package com.hrmpro.module.recruitment.entity;

import com.hrmpro.module.recruitment.enums.InterviewType;
import com.hrmpro.module.recruitment.enums.InterviewResult;
import com.hrmpro.module.recruitment.enums.InterviewApprovalStatus;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "interviews")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Interview {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "application_id", nullable = false)
    private Application application;

    @Builder.Default
    private Integer round = 1;

    @Column(name = "interview_type", length = 20)
    @Enumerated(EnumType.STRING)
    private InterviewType interviewType;

    @Column(name = "scheduled_at")
    private LocalDateTime scheduledAt;

    @Column(name = "duration_minutes")
    @Builder.Default
    private Integer durationMinutes = 60;

    @Column(length = 200)
    private String location;

    @Column(name = "meeting_url")
    private String meetingUrl;

    private String interviewers; 

    @Column(length = 20)
    @Enumerated(EnumType.STRING)
    private InterviewResult result;

    private String feedback;

    @Column(name = "approval_status", length = 20)
    @Enumerated(EnumType.STRING)
    @Builder.Default
    private InterviewApprovalStatus approvalStatus = InterviewApprovalStatus.PENDING;

    @Column(name = "approval_feedback")
    private String approvalFeedback;

    @Column(name = "approved_at")
    private LocalDateTime approvedAt;

    @Column(name = "created_at")
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
}
