import React, { createContext, useContext, useState, ReactNode } from 'react';
import axios, { AxiosError } from 'axios';

// Define the context and types
interface UserServiceContextProps {
  searchUserByTagName: (tagName: string) => Promise<any>;
  updateUser: (userId: string, formData: FormData) => Promise<any>;
  updateStatus: (userId: string, status: string) => Promise<any>;
  updateStatusVisibility: (userId: string, showOnlineStatus: boolean) => Promise<any>;
  getStatus: (userId: string) => Promise<any>;
  getUserInfo: (userId: string) => Promise<any>;
}

const UserServiceContext = createContext<UserServiceContextProps | undefined>(undefined);

export const UserServiceProvider = ({ children }: { children: ReactNode }) => {
  const [baseUrl] = useState('https://your-api-base-url.com/api/Users');

  const handleError = (error: AxiosError) => {
    console.error('An error occurred:', error.message);
    throw error;
  };

  const searchUserByTagName = async (tagName: string) => {
    try {
      const response = await axios.get(`${baseUrl}/search`, {
        params: { tagName },
      });
      return response.data;
    } catch (error) {
      handleError(error as AxiosError);
    }
  };

  const updateUser = async (userId: string, formData: FormData) => {
    try {
      const response = await axios.put(`${baseUrl}/${userId}/update-user`, formData);
      return response.data;
    } catch (error) {
      handleError(error as AxiosError);
    }
  };

  const updateStatus = async (userId: string, status: string) => {
    try {
      const response = await axios.post(`${baseUrl}/${userId}/update-status`, { status });
      return response.data;
    } catch (error) {
      handleError(error as AxiosError);
    }
  };

  const updateStatusVisibility = async (userId: string, showOnlineStatus: boolean) => {
    try {
      const response = await axios.post(`${baseUrl}/${userId}/update-status-visibility`, { showOnlineStatus });
      return response.data;
    } catch (error) {
      handleError(error as AxiosError);
    }
  };

  const getStatus = async (userId: string) => {
    try {
      const response = await axios.get(`${baseUrl}/${userId}/status`);
      return response.data;
    } catch (error) {
      handleError(error as AxiosError);
    }
  };

  const getUserInfo = async (userId: string) => {
    try {
      const response = await axios.get(`${baseUrl}/${userId}/get-user-info`);
      return response.data;
    } catch (error) {
      handleError(error as AxiosError);
    }
  };

  return (
    <UserServiceContext.Provider
      value={{
        searchUserByTagName,
        updateUser,
        updateStatus,
        updateStatusVisibility,
        getStatus,
        getUserInfo,
      }}
    >
      {children}
    </UserServiceContext.Provider>
  );
};

// Custom hook to use the service
export const useUserService = () => {
  const context = useContext(UserServiceContext);
  if (!context) {
    throw new Error('useUserService must be used within a UserServiceProvider');
  }
  return context;
};
