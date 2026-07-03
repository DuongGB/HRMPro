import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useWebSocket } from '../../hooks/useWebSocket';
import { useAppSelector } from '../../store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MessageCircle, X, Send, Search, ChevronLeft } from 'lucide-react';
import api from '../../config/api';

interface ChatMessage {
  id: string;
  senderId: number;
  senderName: string;
  senderAvatar?: string;
  receiverId: number;
  content: string;
  isRead: boolean;
  createdAt: string;
}

interface ChatContact {
  id: number;
  fullName: string;
  avatarUrl?: string;
  departmentName?: string;
  unreadCount: number;
  lastMessageContent?: string;
  lastMessageTime?: string;
}

const ChatWidget: React.FC = () => {
  const { isConnected, stompClient } = useWebSocket();
  const currentUser = useAppSelector((state: any) => state.auth.user);

  const [isOpen, setIsOpen] = useState(false);
  const [activeContact, setActiveContact] = useState<{ id: number, name: string, avatar?: string } | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [contacts, setContacts] = useState<ChatContact[]>([]);
  const [search, setSearch] = useState('');
  const [totalUnread, setTotalUnread] = useState(0);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const activeContactRef = useRef<{ id: number, name: string, avatar?: string } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Đồng bộ activeContact vào ref để sử dụng trong WebSocket callback
  useEffect(() => {
    activeContactRef.current = activeContact;
  }, [activeContact]);

  // Lấy tổng số tin nhắn chưa đọc (dùng cho badge trên icon)
  const fetchUnreadCount = useCallback(async () => {
    try {
      const res = await api.get('/chat/unread-count');
      setTotalUnread(res.data || 0);
    } catch (error) {
      console.error("Error fetching unread count", error);
    }
  }, []);

  // Fetch unread count khi mount và định kỳ
  useEffect(() => {
    if (currentUser?.employeeId) {
      fetchUnreadCount();
    }
  }, [currentUser, fetchUnreadCount]);

  // Lấy danh sách liên hệ từ endpoint chat contacts (đã sort theo tin nhắn mới nhất)
  const fetchContacts = useCallback(async () => {
    try {
      const res = await api.get('/chat/contacts', {
        params: { search: search || undefined, page: 0, size: 20 }
      });
      setContacts(res.data || []);
    } catch (error) {
      console.error("Error fetching chat contacts", error);
    }
  }, [search]);

  useEffect(() => {
    if (isOpen && !activeContact) {
      fetchContacts();
    }
  }, [isOpen, activeContact, search, currentUser, fetchContacts]);

  // Lấy lịch sử chat khi chọn 1 contact + đánh dấu đã đọc
  useEffect(() => {
    if (activeContact && isOpen) {
      const openConversation = async () => {
        try {
          // Đánh dấu tin nhắn đã đọc
          await api.put(`/chat/read/${activeContact.id}`);

          // Lấy lịch sử
          const res = await api.get(`/chat/history/${activeContact.id}`);
          setMessages(res.data || []);

          // Cập nhật lại unread count
          fetchUnreadCount();

          // Cập nhật unread count trong contacts list
          setContacts(prev => prev.map(c =>
            c.id === activeContact.id ? { ...c, unreadCount: 0 } : c
          ));
        } catch (error) {
          console.error("Error opening conversation", error);
        }
      };
      openConversation();
    }
  }, [activeContact, isOpen, fetchUnreadCount]);

  // Cuộn xuống cuối khi có tin nhắn mới
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Đăng ký nhận tin nhắn realtime qua STOMP
  useEffect(() => {
    if (isConnected && stompClient && currentUser?.username) {
      const subscription = stompClient.subscribe('/user/queue/chat', (message: any) => {
        if (message.body) {
          const newMsg = JSON.parse(message.body);

          // Cập nhật tin nhắn trong cuộc hội thoại hiện tại
          setMessages((prev) => {
            const currentContact = activeContactRef.current;
            if (!currentContact) return prev;
            const isRelevant = newMsg.senderId === currentContact.id || newMsg.receiverId === currentContact.id;
            if (!isRelevant) return prev;
            if (prev.find(m => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });

          // Nếu tin nhắn ĐẾN cho mình (không phải mình gửi)
          if (newMsg.receiverId === currentUser.employeeId) {
            const currentContact = activeContactRef.current;
            const isCurrentConversation = currentContact && newMsg.senderId === currentContact.id;

            if (isCurrentConversation) {
              // Đang mở đúng cuộc hội thoại → đánh dấu đã đọc ngay
              api.put(`/chat/read/${newMsg.senderId}`).catch(() => {});
            } else {
              // Không phải cuộc hội thoại đang mở → tăng unread
              setTotalUnread(prev => prev + 1);

              // Cập nhật unread count trong contacts list
              setContacts(prev => prev.map(c =>
                c.id === newMsg.senderId
                  ? { ...c, unreadCount: c.unreadCount + 1, lastMessageContent: newMsg.content, lastMessageTime: newMsg.createdAt }
                  : c
              ));
            }
          }

          // Cập nhật lastMessage trong contacts (cho cả sender lẫn receiver)
          const contactId = newMsg.senderId === currentUser.employeeId ? newMsg.receiverId : newMsg.senderId;
          setContacts(prev => {
            const updated = prev.map(c =>
              c.id === contactId
                ? { ...c, lastMessageContent: newMsg.content, lastMessageTime: newMsg.createdAt }
                : c
            );
            // Re-sort: contact có tin nhắn mới nhất lên đầu
            return updated.sort((a, b) => {
              if (!a.lastMessageTime && !b.lastMessageTime) return 0;
              if (!a.lastMessageTime) return 1;
              if (!b.lastMessageTime) return -1;
              return new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime();
            });
          });
        }
      });
      return () => {
        subscription.unsubscribe();
      };
    }
  }, [isConnected, stompClient, currentUser, fetchUnreadCount]);

  const handleSendMessage = () => {
    if (!inputValue.trim() || !activeContact || !currentUser?.employeeId || !stompClient) return;
    
    const payload = {
      senderId: currentUser.employeeId,
      receiverId: activeContact.id,
      content: inputValue
    };
    
    stompClient.publish({
      destination: '/app/chat.sendMessage',
      body: JSON.stringify(payload)
    });
    
    setInputValue('');
  };

  // ==================== Keyboard Shortcuts ====================
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Esc: đóng chat hoặc quay về danh sách
      if (e.key === 'Escape') {
        if (isOpen) {
          if (activeContact) {
            setActiveContact(null); // Quay về danh sách contacts
          } else {
            setIsOpen(false); // Đóng widget
          }
          e.preventDefault();
        }
      }

      // Ctrl+Shift+M: Toggle mở/đóng chat widget
      if (e.ctrlKey && e.shiftKey && e.key === 'M') {
        e.preventDefault();
        setIsOpen(prev => {
          if (prev && activeContact) {
            setActiveContact(null);
          }
          return !prev;
        });
      }

      // Ctrl+Shift+F: Focus vào ô tìm kiếm khi đang ở danh sách contacts
      if (e.ctrlKey && e.shiftKey && e.key === 'F') {
        if (isOpen && !activeContact) {
          e.preventDefault();
          searchInputRef.current?.focus();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, activeContact]);

  // Auto-focus input khi mở conversation
  useEffect(() => {
    if (activeContact && isOpen) {
      // Delay nhỏ để đợi DOM render
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [activeContact, isOpen]);

  // Auto-focus search khi mở danh sách contacts
  useEffect(() => {
    if (isOpen && !activeContact) {
      setTimeout(() => searchInputRef.current?.focus(), 100);
    }
  }, [isOpen, activeContact]);

  /**
   * Format thời gian tin nhắn gần nhất cho danh sách contacts
   */
  const formatLastTime = (timeStr?: string) => {
    if (!timeStr) return '';
    const date = new Date(timeStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Vừa xong';
    if (diffMins < 60) return `${diffMins} phút`;
    if (diffHours < 24) return `${diffHours} giờ`;
    if (diffDays < 7) return `${diffDays} ngày`;
    return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
  };

  if (!currentUser?.employeeId) return null;

  const displayUnread = totalUnread > 99 ? '99+' : totalUnread;

  return (
    <div className="fixed bottom-20 right-6 z-50">
      {!isOpen && (
        <div className="relative">
          <Button 
            onClick={() => setIsOpen(true)}
            className="h-14 w-14 rounded-full shadow-lg flex items-center justify-center bg-primary text-primary-foreground hover:bg-primary/90 transition-transform hover:scale-105"
          >
            <MessageCircle size={28} />
          </Button>
          {totalUnread > 0 && (
            <span className="absolute -top-1 -right-1 min-w-[22px] h-[22px] px-1.5 flex items-center justify-center rounded-full bg-destructive text-destructive-foreground text-xs font-bold shadow-md animate-in zoom-in-50">
              {displayUnread}
            </span>
          )}
        </div>
      )}

      {isOpen && (
        <div className="bg-background border rounded-lg shadow-xl w-[350px] h-[500px] flex flex-col overflow-hidden animate-in slide-in-from-bottom-5">
          {/* Header */}
          <div className="bg-primary text-primary-foreground px-4 py-3 flex items-center justify-between">
            {activeContact ? (
              <div className="flex items-center gap-2">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-7 w-7 text-primary-foreground hover:bg-primary/80 rounded-full shrink-0" 
                  onClick={() => setActiveContact(null)}
                  title="Quay lại (Esc)"
                >
                  <ChevronLeft size={20} />
                </Button>
                <div className="font-medium truncate">{activeContact.name}</div>
              </div>
            ) : (
              <div className="font-medium text-lg flex items-center gap-2">
                <MessageCircle size={20} />
                Tin nhắn nội bộ
                {totalUnread > 0 && (
                  <span className="ml-1 min-w-[20px] h-[20px] px-1.5 flex items-center justify-center rounded-full bg-destructive text-destructive-foreground text-xs font-bold">
                    {displayUnread}
                  </span>
                )}
              </div>
            )}
            <Button variant="ghost" size="icon" className="h-8 w-8 text-primary-foreground hover:bg-primary/80 rounded-full" onClick={() => setIsOpen(false)}>
              <X size={18} />
            </Button>
          </div>

          {/* Body */}
          <div className="flex-1 flex flex-col overflow-hidden bg-muted/10">
            {!activeContact ? (
              // Contact List View
              <div className="flex flex-col h-full">
                <div className="p-3 border-b">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input 
                      ref={searchInputRef}
                      placeholder="Tìm kiếm đồng nghiệp..." 
                      className="pl-8 bg-background" 
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                    />
                  </div>
                </div>
                <ScrollArea className="flex-1">
                  <div className="p-2 space-y-0.5">
                    {contacts.map((contact) => (
                      <div 
                        key={contact.id} 
                        className={`flex items-center gap-3 p-2.5 rounded-md hover:bg-muted cursor-pointer transition-colors ${contact.unreadCount > 0 ? 'bg-primary/5' : ''}`}
                        onClick={() => setActiveContact({ id: contact.id, name: contact.fullName, avatar: contact.avatarUrl })}
                      >
                        <div className="relative">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={contact.avatarUrl} />
                            <AvatarFallback>{contact.fullName?.charAt(0) || '?'}</AvatarFallback>
                          </Avatar>
                          {contact.unreadCount > 0 && (
                            <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold">
                              {contact.unreadCount > 99 ? '99+' : contact.unreadCount}
                            </span>
                          )}
                        </div>
                        <div className="flex-1 overflow-hidden">
                          <div className="flex items-center justify-between gap-2">
                            <div className={`truncate ${contact.unreadCount > 0 ? 'font-semibold' : 'font-medium'}`}>
                              {contact.fullName}
                            </div>
                            {contact.lastMessageTime && (
                              <span className="text-[10px] text-muted-foreground whitespace-nowrap shrink-0">
                                {formatLastTime(contact.lastMessageTime)}
                              </span>
                            )}
                          </div>
                          <div className={`text-xs truncate ${contact.unreadCount > 0 ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
                            {contact.lastMessageContent || contact.departmentName || 'Chưa có tin nhắn'}
                          </div>
                        </div>
                      </div>
                    ))}
                    {contacts.length === 0 && (
                      <div className="text-center p-4 text-muted-foreground text-sm">
                        Không tìm thấy liên hệ nào.
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </div>
            ) : (
              // Chat View
              <div className="flex flex-col h-full">
                <ScrollArea className="flex-1 p-4">
                  <div className="space-y-4">
                    {messages.map((msg, idx) => {
                      const isMe = msg.senderId === currentUser.employeeId;
                      return (
                        <div key={msg.id || idx} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm ${isMe ? 'bg-primary text-primary-foreground rounded-tr-sm' : 'bg-muted rounded-tl-sm'}`}>
                            {msg.content}
                          </div>
                        </div>
                      );
                    })}
                    <div ref={messagesEndRef} />
                  </div>
                </ScrollArea>
                <div className="p-3 bg-background border-t">
                  <form 
                    onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }}
                    className="flex items-center gap-2"
                  >
                    <Input 
                      ref={inputRef}
                      placeholder="Nhập tin nhắn..." 
                      className="flex-1 rounded-full bg-muted/50 focus-visible:ring-1" 
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                    />
                    <Button type="submit" size="icon" className="h-9 w-9 rounded-full shrink-0" disabled={!inputValue.trim()}>
                      <Send size={16} />
                    </Button>
                  </form>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatWidget;
