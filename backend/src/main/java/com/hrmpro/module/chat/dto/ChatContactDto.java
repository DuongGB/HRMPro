package com.hrmpro.module.chat.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * DTO tối giản cho danh sách liên hệ trong chat nội bộ.
 * Chỉ chứa thông tin cần thiết để hiển thị danh sách người nhận,
 * không lộ thông tin nhạy cảm của nhân viên.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChatContactDto {
    private Long id;
    private String fullName;
    private String avatarUrl;
    private String departmentName;

    /** Số tin nhắn chưa đọc từ người này */
    @Builder.Default
    private long unreadCount = 0;

    /** Nội dung tin nhắn gần nhất (preview) */
    private String lastMessageContent;

    /** Thời gian tin nhắn gần nhất */
    private LocalDateTime lastMessageTime;
}
