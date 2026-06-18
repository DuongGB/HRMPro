package com.hrmpro.module.chat.controller;

import com.hrmpro.common.dto.ApiResponse;
import com.hrmpro.module.auth.entity.UserPrincipal;
import com.hrmpro.module.auth.repository.UserRepository;
import com.hrmpro.module.chat.dto.ChatMessageDto;
import com.hrmpro.module.chat.document.ChatMessage;
import com.hrmpro.module.chat.repository.ChatMessageMongoRepository;
import com.hrmpro.module.employee.entity.Employee;
import com.hrmpro.module.employee.repository.EmployeeRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/chat")
@RequiredArgsConstructor
@Slf4j
public class ChatController {

    private final ChatMessageMongoRepository chatMessageRepository;
    private final EmployeeRepository employeeRepository;
    private final UserRepository userRepository;
    private final SimpMessagingTemplate messagingTemplate;

    // API lấy lịch sử chat
    @GetMapping("/history/{targetEmployeeId}")
    public ResponseEntity<ApiResponse<List<ChatMessageDto>>> getChatHistory(
            @PathVariable Long targetEmployeeId,
            @AuthenticationPrincipal UserPrincipal principal) {

        List<ChatMessage> history = chatMessageRepository.findChatHistory(principal.getEmployeeId(), targetEmployeeId);

        List<ChatMessageDto> dtos = history.stream().map(msg -> ChatMessageDto.builder()
                .id(msg.getId())
                .senderId(msg.getSenderId())
                .senderName(msg.getSenderId() != null ? getEmployeeName(msg.getSenderId()) : "Unknown") // Fallback sender name
                .senderAvatar(msg.getSenderId() != null ? getEmployeeAvatar(msg.getSenderId()) : null) // Fallback sender avatar
                .receiverId(msg.getReceiverId())
                .content(msg.getContent())
                .isRead(msg.getIsRead())
                .createdAt(msg.getCreatedAt())
                .build()).collect(Collectors.toList());

        return ResponseEntity.ok(ApiResponse.ok("Lấy lịch sử chat thành công", dtos));
    }

    // Xử lý STOMP message
    @MessageMapping("/chat.sendMessage")
    public void sendMessage(@Payload ChatMessageDto chatMessageDto, SimpMessageHeaderAccessor headerAccessor) {
        if (headerAccessor.getUser() == null) {
            throw new IllegalStateException("WebSocket user is not authenticated");
        }

        // Lấy username từ principal đã được lưu khi handshake
        String senderUsername = headerAccessor.getUser().getName();
        log.info("Processing chat message from user={} senderId={} receiverId={}",
                senderUsername, chatMessageDto.getSenderId(), chatMessageDto.getReceiverId());
        
        Employee sender = employeeRepository.findById(chatMessageDto.getSenderId())
                .orElseThrow(() -> new RuntimeException("Sender not found"));
        Employee receiver = employeeRepository.findById(chatMessageDto.getReceiverId())
                .orElseThrow(() -> new RuntimeException("Receiver not found"));

        // Lưu vào MongoDB với senderId và receiverId (không dùng object relationship như JPA)
        final ChatMessage savedMessage = chatMessageRepository.save(ChatMessage.builder()
                .senderId(sender.getId())
                .receiverId(receiver.getId())
                .content(chatMessageDto.getContent())
                .isRead(false)
                .createdAt(LocalDateTime.now())
                .build());

        ChatMessageDto responseDto = ChatMessageDto.builder()
                .id(savedMessage.getId())
                .senderId(sender.getId())
                .senderName(sender.getFullName())
                .senderAvatar(sender.getAvatarUrl())
                .receiverId(receiver.getId())
                .content(savedMessage.getContent())
                .isRead(false)
                .createdAt(savedMessage.getCreatedAt())
                .build();

        // Gửi qua WebSocket cho receiver
        // Phải tìm username của receiver để gửi qua SimpMessagingTemplate
        userRepository.findByEmployeeId(receiver.getId()).ifPresentOrElse(receiverUser -> {
            messagingTemplate.convertAndSendToUser(
                    receiverUser.getUsername(),
                    "/queue/chat",
                    responseDto
            );
            log.info("Delivered chat message id={} to receiver username={}", savedMessage.getId(), receiverUser.getUsername());
        }, () -> log.warn("Cannot deliver chat message id={} because receiver employeeId={} has no linked user account",
                savedMessage.getId(), receiver.getId()));

        // Gửi lại cho chính sender để xác nhận đã gửi thành công
        messagingTemplate.convertAndSendToUser(
                senderUsername,
                "/queue/chat",
                responseDto
        );
        log.info("Delivered chat message id={} back to sender username={}", savedMessage.getId(), senderUsername);
    }

    // Helper methods to get employee details
    private String getEmployeeName(Long employeeId) {
        try {
            return employeeRepository.findById(employeeId)
                    .map(Employee::getFullName)
                    .orElse("Unknown User");
        } catch (Exception e) {
            log.error("Error fetching employee name for id {}: {}", employeeId, e.getMessage());
            return "Unknown User";
        }
    }

    private String getEmployeeAvatar(Long employeeId) {
        try {
            return employeeRepository.findById(employeeId)
                    .map(Employee::getAvatarUrl)
                    .orElse(null);
        } catch (Exception e) {
            log.error("Error fetching employee avatar for id {}: {}", employeeId, e.getMessage());
            return null;
        }
    }
}
