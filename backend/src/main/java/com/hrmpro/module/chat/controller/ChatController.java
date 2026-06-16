package com.hrmpro.module.chat.controller;

import com.hrmpro.common.dto.ApiResponse;
import com.hrmpro.module.auth.entity.UserPrincipal;
import com.hrmpro.module.auth.repository.UserRepository;
import com.hrmpro.module.chat.dto.ChatMessageDto;
import com.hrmpro.module.chat.entity.ChatMessage;
import com.hrmpro.module.chat.repository.ChatMessageRepository;
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

    private final ChatMessageRepository chatMessageRepository;
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
                .senderId(msg.getSender().getId())
                .senderName(msg.getSender().getFullName())
                .senderAvatar(msg.getSender().getAvatarUrl())
                .receiverId(msg.getReceiver().getId())
                .content(msg.getContent())
                .isRead(msg.getIsRead())
                .createdAt(msg.getCreatedAt())
                .build()).collect(Collectors.toList());

        return ResponseEntity.ok(ApiResponse.ok("Lấy lịch sử chat thành công", dtos));
    }

    // Xử lý STOMP message
    @MessageMapping("/chat.sendMessage")
    public void sendMessage(@Payload ChatMessageDto chatMessageDto, SimpMessageHeaderAccessor headerAccessor) {
        // Lấy username từ headerAccessor (đã được lưu khi handshake)
        String senderUsername = headerAccessor.getUser().getName();
        
        Employee sender = employeeRepository.findById(chatMessageDto.getSenderId())
                .orElseThrow(() -> new RuntimeException("Sender not found"));
        Employee receiver = employeeRepository.findById(chatMessageDto.getReceiverId())
                .orElseThrow(() -> new RuntimeException("Receiver not found"));

        ChatMessage message = ChatMessage.builder()
                .sender(sender)
                .receiver(receiver)
                .content(chatMessageDto.getContent())
                .isRead(false)
                .createdAt(LocalDateTime.now())
                .build();

        message = chatMessageRepository.save(message);

        ChatMessageDto responseDto = ChatMessageDto.builder()
                .id(message.getId())
                .senderId(sender.getId())
                .senderName(sender.getFullName())
                .senderAvatar(sender.getAvatarUrl())
                .receiverId(receiver.getId())
                .content(message.getContent())
                .isRead(false)
                .createdAt(message.getCreatedAt())
                .build();

        // Gửi qua WebSocket cho receiver
        // Phải tìm username của receiver để gửi qua SimpMessagingTemplate
        userRepository.findByEmployeeId(receiver.getId()).ifPresent(receiverUser -> {
            messagingTemplate.convertAndSendToUser(
                    receiverUser.getUsername(),
                    "/queue/chat",
                    responseDto
            );
        });

        // Tùy chọn: Gửi lại cho chính sender để xác nhận đã gửi thành công (để hiển thị trên UI bên kia màn hình hoặc update trạng thái)
        messagingTemplate.convertAndSendToUser(
                senderUsername,
                "/queue/chat",
                responseDto
        );
    }
}
