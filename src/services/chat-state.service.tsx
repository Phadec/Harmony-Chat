import React, { createContext, useContext, useState, ReactNode } from 'react';

// Define types for the state
interface ChatState {
  recipientInfo: any | null;
  selectedRecipientId: string | null;
  messages: any[];
}

// Define types for the context
interface ChatStateContextProps extends ChatState {
  updateRecipientInfo: (info: any | null) => void;
  updateMessages: (messages: any[]) => void;
  resetChatState: () => void;
  setSelectedRecipient: (recipientId: string | null) => void;
}

// Create the context
const ChatStateContext = createContext<ChatStateContextProps | undefined>(undefined);

// ChatStateProvider component
export const ChatStateProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [recipientInfo, setRecipientInfo] = useState<any | null>(null);
  const [selectedRecipientId, setSelectedRecipientId] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);

  const updateRecipientInfo = (info: any | null) => {
    if (info) {
      console.log('ChatStateService - Updating recipient info:', info);
      setRecipientInfo(info);
    } else {
      resetChatState();
    }
  };

  const updateMessages = (newMessages: any[]) => {
    console.log('ChatStateService - Updating messages:', newMessages);
    setMessages(newMessages);
  };

  const resetChatState = () => {
    console.log('ChatStateService - Resetting chat state');
    setRecipientInfo(null);
    setMessages([]);
  };

  const setSelectedRecipient = (recipientId: string | null) => {
    setSelectedRecipientId(recipientId);
  };

  return (
    <ChatStateContext.Provider
      value={{
        recipientInfo,
        selectedRecipientId,
        messages,
        updateRecipientInfo,
        updateMessages,
        resetChatState,
        setSelectedRecipient,
      }}
    >
      {children}
    </ChatStateContext.Provider>
  );
};

// Custom hook to use the ChatStateContext
export const useChatState = () => {
  const context = useContext(ChatStateContext);
  if (!context) {
    throw new Error('useChatState must be used within a ChatStateProvider');
  }
  return context;
};
