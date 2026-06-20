package com.hrmpro.module.chat.controller;

import com.hrmpro.common.dto.ApiResponse;
import com.hrmpro.common.service.MinioService;
import com.hrmpro.module.auth.entity.UserPrincipal;
import com.hrmpro.module.auth.repository.UserRepository;
import com.hrmpro.module.chat.dto.ChatContactDto;
import com.hrmpro.module.chat.dto.ChatMessageDto;
import com.hrmpro.module.chat.document.ChatMessage;
import com.hrmpro.module.chat.repository.ChatMessageMongoRepository;
import com.hrmpro.module.employee.entity.Employee;
import com.hrmpro.module.employee.repository.EmployeeRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.*;
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
    private final MinioService minioService;

    @Value("${app.minio.bucket.avatars:hrmpro-avatars}")
    private String avatarBucket;

    /**
     * API lấy danh sách liên hệ cho chat nội bộ.
     * - Ưu tiên hiển thị người đã từng chat (sort theo tin nhắn mới nhất)
     * - Tiếp theo là danh sách nhân viên còn lại
     * - Kèm unreadCount và preview tin nhắn cuối
     */
    @GetMapping("/contacts")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<List<ChatContactDto>>> getChatContacts(
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @AuthenticationPrincipal UserPrincipal principal) {

        Long myId = principal.getEmployeeId();

        // 1. Lấy tất cả tin nhắn liên quan đến user hiện tại (sort mới nhất trước)
        Sort sortByTime = Sort.by(Sort.Direction.DESC, "createdAt");
        List<ChatMessage> allMyMessages = chatMessageRepository.findAllByUserId(myId, sortByTime);

        // 2. Build map: contactId -> tin nhắn gần nhất + unread count
        // LinkedHashMap giữ thứ tự insertion (= thứ tự thời gian mới nhất)
        LinkedHashMap<Long, ChatMessage> lastMessageByContact = new LinkedHashMap<>();
        Map<Long, Long> unreadCountByContact = new HashMap<>();

        for (ChatMessage msg : allMyMessages) {
            Long contactId = msg.getSenderId().equals(myId) ? msg.getReceiverId() : msg.getSenderId();

            // Chỉ lưu tin nhắn đầu tiên (mới nhất) cho mỗi contact
            lastMessageByContact.putIfAbsent(contactId, msg);

            // Đếm unread: chỉ đếm tin nhắn người khác gửi cho mình mà chưa đọc
            if (msg.getReceiverId().equals(myId) && !Boolean.TRUE.equals(msg.getIsRead())) {
                unreadCountByContact.merge(contactId, 1L, Long::sum);
            }
        }

        // 3. Nếu đang search -> lọc danh sách employee theo search keyword
        String searchPattern = (search != null && !search.isBlank())
                ? "%" + search.trim().toLowerCase() + "%" : null;

        if (searchPattern != null) {
            // Khi search: lấy nhân viên khớp từ DB, enrich với chat data
            Page<Employee> employees = employeeRepository.findEmployeesWithFilters(
                    searchPattern, null, "ACTIVE", PageRequest.of(page, size));

            List<ChatContactDto> contacts = employees.getContent().stream()
                    .filter(e -> !e.getId().equals(myId))
                    .map(e -> buildContactDto(e, lastMessageByContact.get(e.getId()),
                            unreadCountByContact.getOrDefault(e.getId(), 0L)))
                    .sorted(Comparator.comparing(
                            (ChatContactDto c) -> c.getLastMessageTime() != null ? c.getLastMessageTime() : LocalDateTime.MIN)
                            .reversed())
                    .collect(Collectors.toList());

            return ResponseEntity.ok(ApiResponse.ok("Lấy danh sách liên hệ chat thành công", contacts));
        }

        // 4. Không search: ưu tiên người đã từng chat (sort theo tin nhắn mới nhất)
        List<ChatContactDto> result = new ArrayList<>();
        Set<Long> addedIds = new HashSet<>();

        // 4a. Thêm người đã từng chat (theo thứ tự tin nhắn mới nhất)
        for (Map.Entry<Long, ChatMessage> entry : lastMessageByContact.entrySet()) {
            if (result.size() >= size) break;

            Long contactId = entry.getKey();
            ChatMessage lastMsg = entry.getValue();

            employeeRepository.findById(contactId).ifPresent(emp -> {
                if ("ACTIVE".equals(emp.getStatus())) {
                    result.add(buildContactDto(emp, lastMsg,
                            unreadCountByContact.getOrDefault(contactId, 0L)));
                    addedIds.add(contactId);
                }
            });
        }

        // 4b. Nếu còn chỗ, thêm nhân viên chưa từng chat
        if (result.size() < size) {
            int remaining = size - result.size();
            Page<Employee> moreEmployees = employeeRepository.findEmployeesWithFilters(
                    null, null, "ACTIVE", PageRequest.of(0, remaining + addedIds.size() + 1));

            moreEmployees.getContent().stream()
                    .filter(e -> !e.getId().equals(myId) && !addedIds.contains(e.getId()))
                    .limit(remaining)
                    .forEach(e -> result.add(buildContactDto(e, null, 0)));
        }

        return ResponseEntity.ok(ApiResponse.ok("Lấy danh sách liên hệ chat thành công", result));
    }

    /**
     * API lấy tổng số tin nhắn chưa đọc của user hiện tại.
     * Dùng để hiển thị badge trên icon chat.
     */
    @GetMapping("/unread-count")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<Long>> getUnreadCount(
            @AuthenticationPrincipal UserPrincipal principal) {
        long count = chatMessageRepository.countByReceiverIdAndIsReadFalse(principal.getEmployeeId());
        return ResponseEntity.ok(ApiResponse.ok("Lấy số tin nhắn chưa đọc thành công", count));
    }

    /**
     * API đánh dấu tất cả tin nhắn từ sender gửi cho mình là đã đọc.
     * Được gọi khi user mở cuộc hội thoại với sender.
     */
    @PutMapping("/read/{senderEmployeeId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<Void>> markAsRead(
            @PathVariable Long senderEmployeeId,
            @AuthenticationPrincipal UserPrincipal principal) {
        chatMessageRepository.markMessagesAsRead(senderEmployeeId, principal.getEmployeeId());
        return ResponseEntity.ok(ApiResponse.ok("Đã đánh dấu tin nhắn đã đọc", null));
    }

    // API lấy lịch sử chat
    @GetMapping("/history/{targetEmployeeId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<List<ChatMessageDto>>> getChatHistory(
            @PathVariable Long targetEmployeeId,
            @AuthenticationPrincipal UserPrincipal principal) {

        List<ChatMessage> history = chatMessageRepository.findChatHistory(principal.getEmployeeId(), targetEmployeeId);

        List<ChatMessageDto> dtos = history.stream().map(msg -> ChatMessageDto.builder()
                .id(msg.getId())
                .senderId(msg.getSenderId())
                .senderName(msg.getSenderId() != null ? getEmployeeName(msg.getSenderId()) : "Unknown")
                .senderAvatar(msg.getSenderId() != null ? getEmployeeAvatar(msg.getSenderId()) : null)
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
                .senderAvatar(getAvatarPresignedUrl(sender.getAvatarUrl()))
                .receiverId(receiver.getId())
                .content(savedMessage.getContent())
                .isRead(false)
                .createdAt(savedMessage.getCreatedAt())
                .build();

        // Gửi qua WebSocket cho receiver
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

    // ==================== Helper methods ====================

    /**
     * Build ChatContactDto từ Employee entity + chat metadata
     */
    private ChatContactDto buildContactDto(Employee emp, ChatMessage lastMessage, long unreadCount) {
        return ChatContactDto.builder()
                .id(emp.getId())
                .fullName(emp.getFullName())
                .avatarUrl(getAvatarPresignedUrl(emp.getAvatarUrl()))
                .departmentName(emp.getDepartment() != null ? emp.getDepartment().getName() : null)
                .unreadCount(unreadCount)
                .lastMessageContent(lastMessage != null ? lastMessage.getContent() : null)
                .lastMessageTime(lastMessage != null ? lastMessage.getCreatedAt() : null)
                .build();
    }

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
                    .map(emp -> getAvatarPresignedUrl(emp.getAvatarUrl()))
                    .orElse(null);
        } catch (Exception e) {
            log.error("Error fetching employee avatar for id {}: {}", employeeId, e.getMessage());
            return null;
        }
    }

    /**
     * Tạo presigned URL cho avatar từ MinIO.
     * Trả null nếu không có avatar hoặc lỗi sinh URL.
     */
    private String getAvatarPresignedUrl(String objectName) {
        if (objectName == null || objectName.isBlank()) {
            return null;
        }
        return minioService.getPresignedUrl(avatarBucket, objectName, 15);
    }
}
