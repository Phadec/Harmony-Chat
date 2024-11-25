import React, { createContext, useContext, useState, ReactNode } from 'react';

// Define types for recipient state
type RecipientInfo = any; // Adjust to your specific recipient info type
type RecipientState = {
  recipientId: string | null;
  recipientInfo: RecipientInfo | null;
};

// Create a context for managing recipient state
const RecipientContext = createContext<RecipientState | undefined>(undefined);
const SetRecipientContext = createContext<{
  setRecipientId: (recipientId: string | null) => void;
  setRecipientInfo: (recipientInfo: RecipientInfo | null) => void;
} | undefined>(undefined);

// Define the types for the `RecipientProvider` props
interface RecipientProviderProps {
  children: ReactNode;
}

// Provider component to wrap your app and provide recipient state
export const RecipientProvider: React.FC<RecipientProviderProps> = ({ children }) => {
  const [recipientId, setRecipientId] = useState<string | null>(null);
  const [recipientInfo, setRecipientInfo] = useState<RecipientInfo | null>(null);

  return (
    <RecipientContext.Provider value={{ recipientId, recipientInfo }}>
      <SetRecipientContext.Provider value={{ setRecipientId, setRecipientInfo }}>
        {children}
      </SetRecipientContext.Provider>
    </RecipientContext.Provider>
  );
};

// Custom hook to get recipient state
export const useRecipientState = (): RecipientState => {
  const context = useContext(RecipientContext);
  if (!context) {
    throw new Error('useRecipientState must be used within a RecipientProvider');
  }
  return context;
};

// Custom hook to update recipient state
export const useSetRecipientState = () => {
  const context = useContext(SetRecipientContext);
  if (!context) {
    throw new Error('useSetRecipientState must be used within a RecipientProvider');
  }
  return context;
};
