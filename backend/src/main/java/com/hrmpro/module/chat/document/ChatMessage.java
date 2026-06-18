package com.hrmpro.module.chat.document;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.Field;
import java.time.LocalDateTime;

@Document(collection = "chat_messages")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChatMessage {

    @Id
    private String id; // MongoDB uses String for _id

    @Field("sender_id")
    private Long senderId;

    @Field("receiver_id")
    private Long receiverId;

    @Field("content")
    private String content;

    @Field("is_read")
    @Builder.Default
    private Boolean isRead = false;

    @Field("created_at")
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
}
