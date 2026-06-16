package com.hrmpro.module.notification.service;

import com.hrmpro.module.notification.dto.NotificationResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class RealtimeNotificationService {

    private final SimpMessagingTemplate messagingTemplate;

    public void sendNotificationToUser(String username, NotificationResponse notification) {
        log.info("Sending realtime notification to user: {}", username);
        // Định tuyến đến /user/{username}/queue/notifications
        messagingTemplate.convertAndSendToUser(
                username,
                "/queue/notifications",
                notification
        );
    }

    public void broadcastNotification(NotificationResponse notification) {
        log.info("Broadcasting notification");
        messagingTemplate.convertAndSend(
                "/topic/announcements",
                notification
        );
    }

    public void broadcastKanbanUpdate(Object payload) {
        log.info("Broadcasting Kanban update");
        messagingTemplate.convertAndSend(
                "/topic/recruitment/kanban",
                payload
        );
    }

    public void broadcastInterviewApprovalUpdate(Object payload) {
        log.info("Broadcasting interview approval update");
        messagingTemplate.convertAndSend(
                "/topic/recruitment/interview-approval",
                payload
        );
    }
}
