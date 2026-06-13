package com.hrmpro.module.recruitment.entity;

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
    private String interviewType; // PHONE|ONLINE|ONSITE|TECHNICAL

    @Column(name = "scheduled_at")
    private LocalDateTime scheduledAt;

    @Column(name = "duration_minutes")
    @Builder.Default
    private Integer durationMinutes = 60;

    @Column(length = 200)
    private String location;

    @Column(name = "meeting_url")
    private String meetingUrl;

    private String interviewers; // Danh sách ID người phỏng vấn dạng chuỗi (ví dụ: "1,2,3")

    @Column(length = 20)
    private String result; // PASSED|FAILED|NO_SHOW|RESCHEDULED

    private String feedback;

    @Column(name = "approval_status", length = 20)
    @Builder.Default
    private String approvalStatus = "PENDING"; // PENDING|APPROVED|REJECTED

    @Column(name = "approval_feedback")
    private String approvalFeedback;

    @Column(name = "approved_at")
    private LocalDateTime approvedAt;

    @Column(name = "created_at")
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
}
