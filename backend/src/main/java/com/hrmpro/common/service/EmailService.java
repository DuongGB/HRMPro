package com.hrmpro.common.service;

import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailService {

    private final JavaMailSender mailSender;

    /**
     * Gửi email thông báo phỏng vấn
     * Bọc trong try-catch để tránh sập quy trình nghiệp vụ nếu cấu hình SMTP bị sai trên môi trường test
     */
    public void sendEmail(String to, String subject, String content) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom("hrmpro.system@gmail.com");
            message.setTo(to);
            message.setSubject(subject);
            message.setText(content);
            mailSender.send(message);
            log.info("Đã gửi email thành công tới: {}", to);
        } catch (Exception e) {
            log.error("Lỗi khi gửi email tới {} (Hệ thống vẫn tiếp tục): {}", to, e.getMessage());
            // Không ném ra ngoại lệ để tránh rollback transaction của quy trình lên lịch phỏng vấn
        }
    }

    /**
     * Gửi email định dạng HTML chuyên nghiệp
     */
    public void sendHtmlEmail(String to, String subject, String htmlContent) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom("hrmpro.system@gmail.com");
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(htmlContent, true); // true để chỉ định định dạng HTML
            mailSender.send(message);
            log.info("Đã gửi email HTML thành công tới: {}", to);
        } catch (Exception e) {
            log.error("Lỗi khi gửi email HTML tới {} (Hệ thống vẫn tiếp tục): {}", to, e.getMessage());
        }
    }
}
