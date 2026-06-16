import React, { useState, useEffect, useRef } from 'react';
import { useWebSocket } from '../../hooks/useWebSocket';
import { useAppSelector } from '../../store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MessageCircle, X, Send, Search } from 'lucide-react';
import { employeeApi } from '../../modules/employee/api/employeeApi';
import api from '../../config/api';

interface ChatMessage {
  id: number;
  senderId: number;
  senderName: string;
  senderAvatar?: string;
  receiverId: number;
  content: string;
  isRead: boolean;
  createdAt: string;
}

const ChatWidget: React.FC = () => {
  const { isConnected, stompClient } = useWebSocket();
  const currentUser = useAppSelector((state: any) => state.auth.user);
  
  const [isOpen, setIsOpen] = useState(false);
  const [activeContact, setActiveContact] = useState<{ id: number, name: string, avatar?: string } | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [contacts, setContacts] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Lấy danh sách liên hệ (tạm dùng danh sách employee)
  useEffect(() => {
    if (isOpen && !activeContact) {
      const fetchContacts = async () => {
        try {
          const res = await employeeApi.getEmployees(search, undefined, "", 0, 20);
          setContacts(res.content.filter((c: any) => c.id !== currentUser?.employeeId));
        } catch (error) {
          console.error("Error fetching contacts", error);
        }
      };
      fetchContacts();
    }
  }, [isOpen, activeContact, search, currentUser]);

  // Lấy lịch sử chat khi chọn 1 contact
  useEffect(() => {
    if (activeContact && isOpen) {
      const fetchHistory = async () => {
        try {
          const res = await api.get(`/chat/history/${activeContact.id}`);
          setMessages(res.data || []);
        } catch (error) {
          console.error("Error fetching chat history", error);
        }
      };
      fetchHistory();
    }
  }, [activeContact, isOpen]);

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
          // Thêm vào danh sách nếu đang chat với người này hoặc do chính mình gửi
          setMessages((prev) => {
             // Để tránh duplicate nếu backend gửi lại cho sender
             if (prev.find(m => m.id === newMsg.id)) return prev;
             return [...prev, newMsg];
          });
        }
      });
      return () => {
        subscription.unsubscribe();
      };
    }
  }, [isConnected, stompClient, currentUser]);

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

  if (!currentUser?.employeeId) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {!isOpen && (
        <Button 
          onClick={() => setIsOpen(true)}
          className="h-14 w-14 rounded-full shadow-lg flex items-center justify-center bg-primary text-primary-foreground hover:bg-primary/90 transition-transform hover:scale-105"
        >
          <MessageCircle size={28} />
        </Button>
      )}

      {isOpen && (
        <div className="bg-background border rounded-lg shadow-xl w-[350px] h-[500px] flex flex-col overflow-hidden animate-in slide-in-from-bottom-5">
          {/* Header */}
          <div className="bg-primary text-primary-foreground px-4 py-3 flex items-center justify-between">
            {activeContact ? (
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" className="h-6 px-2 text-primary-foreground hover:bg-primary/80" onClick={() => setActiveContact(null)}>
                  {"< Back"}
                </Button>
                <div className="font-medium">{activeContact.name}</div>
              </div>
            ) : (
              <div className="font-medium text-lg flex items-center gap-2">
                <MessageCircle size={20} />
                Tin nhắn nội bộ
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
                      placeholder="Tìm kiếm đồng nghiệp..." 
                      className="pl-8 bg-background" 
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                    />
                  </div>
                </div>
                <ScrollArea className="flex-1">
                  <div className="p-2 space-y-1">
                    {contacts.map((contact) => (
                      <div 
                        key={contact.id} 
                        className="flex items-center gap-3 p-2 rounded-md hover:bg-muted cursor-pointer transition-colors"
                        onClick={() => setActiveContact({ id: contact.id, name: contact.firstName + ' ' + contact.lastName, avatar: contact.avatarUrl })}
                      >
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={contact.avatarUrl} />
                          <AvatarFallback>{contact.firstName.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 overflow-hidden">
                          <div className="font-medium truncate">{contact.lastName} {contact.firstName}</div>
                          <div className="text-xs text-muted-foreground truncate">{contact.departmentName || 'Chưa xếp phòng ban'}</div>
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
