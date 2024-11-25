import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

// Định nghĩa các type cho sự kiện
interface EventServiceContextType {
  nicknameChanged: string | null;
  newMessage: any;
  memberAdded: any;
  memberRemoved: boolean;
  chatDeleted: boolean;
  messageDeleted: string | null;
  emitNicknameChanged: (newNickname: string) => void;
  emitNewMessage: (message: any) => void;
  emitMemberAdded: (memberInfo: any) => void;
  emitMemberRemoved: () => void;
  emitDeleteChat: () => void;
  emitMessageDeleted: (messageId: string) => void;
}

// Tạo context để chia sẻ sự kiện
const EventServiceContext = createContext<EventServiceContextType | undefined>(undefined);

// Hook để sử dụng service sự kiện
export const useEventService = (): EventServiceContextType => {
  const context = useContext(EventServiceContext);
  if (!context) {
    throw new Error('useEventService must be used within an EventServiceProvider');
  }
  return context;
};

// Định nghĩa kiểu cho props của EventServiceProvider
interface EventServiceProviderProps {
  children: ReactNode;
}

// Provider cho các sự kiện
export const EventServiceProvider: React.FC<EventServiceProviderProps> = ({ children }) => {
  const [nicknameChanged, setNicknameChanged] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState<any>(null);
  const [memberAdded, setMemberAdded] = useState<any>(null);
  const [memberRemoved, setMemberRemoved] = useState<boolean>(false);
  const [chatDeleted, setChatDeleted] = useState<boolean>(false);
  const [messageDeleted, setMessageDeleted] = useState<string | null>(null);

  const emitNicknameChanged = useCallback((newNickname: string) => {
    setNicknameChanged(newNickname);
  }, []);

  const emitNewMessage = useCallback((message: any) => {
    setNewMessage(message);
  }, []);

  const emitMemberAdded = useCallback((memberInfo: any) => {
    setMemberAdded(memberInfo);
  }, []);

  const emitMemberRemoved = useCallback(() => {
    setMemberRemoved(true);
  }, []);

  const emitDeleteChat = useCallback(() => {
    setChatDeleted(true);
  }, []);

  const emitMessageDeleted = useCallback((messageId: string) => {
    setMessageDeleted(messageId);
  }, []);

  return (
    <EventServiceContext.Provider
      value={{
        nicknameChanged,
        newMessage,
        memberAdded,
        memberRemoved,
        chatDeleted,
        messageDeleted,
        emitNicknameChanged,
        emitNewMessage,
        emitMemberAdded,
        emitMemberRemoved,
        emitDeleteChat,
        emitMessageDeleted,
      }}
    >
      {children}
    </EventServiceContext.Provider>
  );
};
