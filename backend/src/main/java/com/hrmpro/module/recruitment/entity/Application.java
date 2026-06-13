package com.hrmpro.module.recruitment.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "applications")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Application {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "job_posting_id", nullable = false)
    private JobPosting jobPosting;

    @Column(name = "candidate_name", nullable = false, length = 200)
    private String candidateName;

    @Column(name = "candidate_email", length = 150)
    private String candidateEmail;

    @Column(name = "candidate_phone", length = 20)
    private String candidatePhone;

    @Column(name = "cv_url")
    private String cvUrl;

    @Column(name = "cover_letter")
    private String coverLetter;

    @Column(length = 50)
    private String source; // LINKEDIN|INDEED|REFERRAL|WEBSITE

    @Column(length = 30)
    @Builder.Default
    private String stage = "NEW"; // NEW|SCREENING|INTERVIEW|OFFER|HIRED|REJECTED

    @Column(name = "rejected_reason")
    private String rejectedReason;

    @Column(name = "applied_at")
    @Builder.Default
    private LocalDateTime appliedAt = LocalDateTime.now();

    @Column(name = "updated_at")
    @Builder.Default
    private LocalDateTime updatedAt = LocalDateTime.now();
}
