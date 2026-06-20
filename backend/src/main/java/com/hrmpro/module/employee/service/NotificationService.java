package com.hrmpro.module.employee.service;

import com.hrmpro.module.auth.entity.User;
import com.hrmpro.module.auth.repository.UserRepository;
import com.hrmpro.module.employee.entity.Employee;
import com.hrmpro.module.employee.entity.Notification;
import com.hrmpro.module.employee.repository.NotificationRepository;
import com.hrmpro.module.notification.dto.NotificationResponse;
import com.hrmpro.module.notification.service.RealtimeNotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final RealtimeNotificationService realtimeNotificationService;
    private final UserRepository userRepository;

    @Transactional
    public void createNotification(Employee recipient, String type, String title, String message, String relatedUrl) {
        Notification notification = Notification.builder()
                .recipient(recipient)
                .type(type)
                .title(title)
                .message(message)
                .relatedUrl(relatedUrl)
                .isRead(false)
                .createdAt(LocalDateTime.now())
                .build();

        notification = notificationRepository.save(notification);

        // Convert to DTO
        NotificationResponse response = NotificationResponse.builder()
                .id(notification.getId())
                .title(notification.getTitle())
                .message(notification.getMessage())
                .type(notification.getType())
                .isRead(notification.getIsRead())
                .relatedUrl(notification.getRelatedUrl())
                .createdAt(notification.getCreatedAt())
                .build();

        // Push real-time
        Optional<User> userOpt = userRepository.findByEmployeeId(recipient.getId());
        if (userOpt.isPresent()) {
            String username = userOpt.get().getUsername();
            realtimeNotificationService.sendNotificationToUser(username, response);
        }
    }
}
