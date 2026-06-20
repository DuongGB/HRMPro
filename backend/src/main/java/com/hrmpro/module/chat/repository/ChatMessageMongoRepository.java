package com.hrmpro.module.chat.repository;

import com.hrmpro.module.chat.document.ChatMessage;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.data.mongodb.repository.Update;
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
     * Đếm tổng tin nhắn chưa đọc cho một người nhận
     */
    long countByReceiverIdAndIsReadFalse(Long receiverId);

    /**
     * Đếm tin nhắn chưa đọc từ một sender cụ thể cho receiver
     */
    long countBySenderIdAndReceiverIdAndIsReadFalse(Long senderId, Long receiverId);

    /**
     * Tìm tin nhắn gần nhất giữa hai người (sắp xếp theo thời gian giảm dần)
     */
    @Query("{ $or: [" +
           "{ 'sender_id': ?0, 'receiver_id': ?1 }, " +
           "{ 'sender_id': ?1, 'receiver_id': ?0 }" +
           "] }")
    List<ChatMessage> findRecentMessages(Long user1, Long user2, Sort sort);

    /**
     * Tìm tất cả tin nhắn mà user hiện tại liên quan (gửi hoặc nhận)
     * Dùng để xác định danh sách người đã từng chat
     */
    @Query("{ $or: [ { 'sender_id': ?0 }, { 'receiver_id': ?0 } ] }")
    List<ChatMessage> findAllByUserId(Long userId, Sort sort);

    /**
     * Đánh dấu tất cả tin nhắn từ sender gửi cho receiver là đã đọc
     */
    @Query("{ 'sender_id': ?0, 'receiver_id': ?1, 'is_read': false }")
    @Update("{ '$set': { 'is_read': true } }")
    void markMessagesAsRead(Long senderId, Long receiverId);
}

