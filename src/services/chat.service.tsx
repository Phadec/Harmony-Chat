import { useState, useEffect } from 'react';
import axios from 'axios';
import AppConfigService from './app-config.service'; // Bạn cần tạo tương tự như service trong Angular

interface RecipientInfo {
  // Định nghĩa các trường của RecipientInfo tại đây, ví dụ:
  name: string;
  email: string;
}

export const ChatService = () => {
  const appConfig = AppConfigService;
  const [apiUrl, setApiUrl] = useState<string>(`${appConfig.getBaseUrl()}/api/chats`);

  // Lấy các mối quan hệ (bạn bè, nhóm)
  const getRelationships = async () => {
    const userId = localStorage.getItem('userId');
    try {
      const response = await axios.get(`${apiUrl}/get-relationships`, { params: { userId: userId || '' } });
      return response.data;
    } catch (error) {
      console.error('Error fetching relationships', error);
    }
  };

  // Lấy các tin nhắn giữa người dùng và người nhận
  const getChats = async (recipientId: string, pageNumber: number = 1, pageSize: number = 20) => {
    const userId = localStorage.getItem('userId');
    try {
      const response = await axios.get(`${apiUrl}/get-chats`, {
        params: {
          userId: userId || '',           // Lấy userId từ localStorage
          recipientId: recipientId,       // Người nhận
          pageNumber: pageNumber.toString(),  // Số trang
          pageSize: pageSize.toString()      // Kích thước trang
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching chats', error);
    }
  };

  // Gửi tin nhắn
  const sendMessage = async (formData: FormData) => {
    try {
      const response = await axios.post(`${apiUrl}/send-message`, formData);
      return response.data;
    } catch (error) {
      console.error('Error sending message', error);
    }
  };

  // Lấy thông tin người nhận
  const getRecipientInfo = async (userId: string, recipientId: string) => {
    try {
      const response = await axios.get<RecipientInfo>(`${apiUrl}/${userId}/recipient-info/${recipientId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching recipient info', error);
    }
  };

  // Đánh dấu tin nhắn là đã đọc
  const markMessageAsRead = async (chatId: string) => {
    try {
      const response = await axios.post(`${apiUrl}/${chatId}/mark-as-read`, {});
      return response.data;
    } catch (error) {
      console.error('Error marking message as read', error);
    }
  };

  // Xóa tất cả tin nhắn giữa người dùng và người nhận
  const deleteChat = async (userId: string, recipientId: string) => {
    try {
      const response = await axios.delete<void>(`${apiUrl}/${userId}/delete-chats/${recipientId}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting chat', error);
    }
  };

  // Thêm phản ứng vào tin nhắn
  const addReaction = async (chatId: string, reactionType: string) => {
    const body = { reactionType };
    try {
      const response = await axios.post(`${apiUrl}/${chatId}/react`, body);
      return response.data;
    } catch (error) {
      console.error('Error adding reaction', error);
    }
  };

  // Xóa phản ứng từ tin nhắn
  const removeReaction = async (chatId: string) => {
    try {
      const response = await axios.delete(`${apiUrl}/${chatId}/remove-reaction`);
      return response.data;
    } catch (error) {
      console.error('Error removing reaction', error);
    }
  };

  // Xóa tin nhắn
  const deleteMessage = async (chatId: string) => {
    try {
      const response = await axios.post(`${apiUrl}/${chatId}/delete-message`, {});
      return response.data;
    } catch (error) {
      console.error('Error deleting message', error);
    }
  };

  // Ghim tin nhắn
  const pinMessage = async (chatId: string) => {
    try {
      const response = await axios.post(`${apiUrl}/${chatId}/pin`, {});
      return response.data;
    } catch (error) {
      console.error('Error pinning message', error);
    }
  };

  // Bỏ ghim tin nhắn
  const unpinMessage = async (chatId: string) => {
    try {
      const response = await axios.post(`${apiUrl}/${chatId}/unpin`, {});
      return response.data;
    } catch (error) {
      console.error('Error unpinning message', error);
    }
  };

  return {
    getRelationships,
    getChats,
    sendMessage,
    getRecipientInfo,
    markMessageAsRead,
    deleteChat,
    addReaction,
    removeReaction,
    deleteMessage,
    pinMessage,
    unpinMessage,
  };
};
