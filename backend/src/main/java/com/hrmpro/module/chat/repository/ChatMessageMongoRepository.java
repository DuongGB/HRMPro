package com.hrmpro.module.chat.repository;

import com.hrmpro.module.chat.document.ChatMessage;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ChatMessageMongoRepository extends MongoRepository<ChatMessage, String> {

    /**
     * Tìm lịch sử chat giữa hai người dùng
     * Bao gồm cả tin nhắn từ user1 gửi cho user2 và user2 gửi cho user1
     */
    @Query("{ $or: [" +
           "{ 'sender_id': ?0, 'receiver_id': ?1 }, " +
           "{ 'sender_id': ?1, 'receiver_id': ?0 }" +
           "] }")
    List<ChatMessage> findChatHistory(Long user1, Long user2);

    /**
     * Tìm các tin nhắn chưa đọc cho một người nhận
     */
    List<ChatMessage> findByReceiverIdAndIsReadFalse(Long receiverId);

    /**
     * Tìm tin nhắn gần nhất giữa hai người
     */
    @Query("{ $or: [" +
           "{ 'sender_id': ?0, 'receiver_id': ?1 }, " +
           "{ 'sender_id': ?1, 'receiver_id': ?0 }" +
           "] }")
    List<ChatMessage> findRecentMessages(Long user1, Long user2);
}
