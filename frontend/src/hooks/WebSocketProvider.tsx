import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { Client } from '@stomp/stompjs';
import { useAppSelector } from '../store';
import { toast } from 'sonner';

interface WebSocketContextType {
  isConnected: boolean;
  stompClient: Client | null;
}

const WebSocketContext = createContext<WebSocketContextType>({
  isConnected: false,
  stompClient: null,
});

export const useWebSocket = () => useContext(WebSocketContext);

export const WebSocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isConnected, setIsConnected] = useState(false);
  const clientRef = useRef<Client | null>(null);
  const accessToken = useAppSelector((state) => state.auth.accessToken);
  const user = useAppSelector((state) => state.auth.user);

  useEffect(() => {
    if (!accessToken || !user?.username) {
      if (clientRef.current) {
        clientRef.current.deactivate();
      }
      return;
    }

    const client = new Client({
      brokerURL: 'ws://localhost:8080/ws',
      connectHeaders: {
        Authorization: `Bearer ${accessToken}`,
      },
      debug: (_str) => {},
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      onConnect: () => {
        setIsConnected(true);
        // Đăng ký nhận thông báo cá nhân
        client.subscribe('/user/queue/notifications', (message) => {
          if (message.body) {
            const notification = JSON.parse(message.body);
            toast.info(notification.title || "Có thông báo mới", {
              description: notification.message,
            });
          }
        });

        // Đăng ký nhận thông báo chung
        client.subscribe(`/topic/announcements`, (message) => {
          if (message.body) {
            const notification = JSON.parse(message.body);
            toast.message(notification.title || "Thông báo hệ thống", {
              description: notification.message,
            });
          }
        });
      },
      onStompError: (frame) => {
        console.error('Broker reported error: ' + frame.headers['message']);
        console.error('Additional details: ' + frame.body);
      },
      onWebSocketClose: () => {
        setIsConnected(false);
      },
    });

    client.activate();
    clientRef.current = client;

    return () => {
      if (clientRef.current) {
        clientRef.current.deactivate();
      }
    };
  }, [accessToken, user?.username]);

  return (
    <WebSocketContext.Provider value={{ isConnected, stompClient: clientRef.current }}>
      {children}
    </WebSocketContext.Provider>
  );
};
