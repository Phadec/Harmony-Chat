import axiosInstance from '../../axiosInstance'; // Import axios instance đã cấu hình
import AppConfigService from "~/services/app-config.service";
interface RecipientInfo {
  name: string;
  email: string;
}

export const ChatService = () => {
  const apiUrl = `${AppConfigService.getBaseUrl()}/api/Chats`;


 const getRelationships = async () => {
    const userId = localStorage.getItem('userId');
    try {
      // Gửi request đến API để lấy danh sách mối quan hệ
      const response = await axiosInstance.get(`${apiUrl}/get-relationships`, {
        params: { userId: userId || '' },
      });

      if (response.data) {
        return response.data; // Trả về dữ liệu nhận được từ API
      } else {
        console.error('Dữ liệu từ API không hợp lệ');
        return null; // Trả về null nếu không có dữ liệu
      }
    } catch (error) {
      console.error('Error fetching relationships:', error);
      return null; // Trả về null trong trường hợp có lỗi
    }
  };


// Lấy các tin nhắn giữa người dùng và người nhận
  const getChats = async (recipientId: string, pageNumber: number = 1, pageSize: number = 20) => {
    const userId = localStorage.getItem('userId');
    if (!userId) return null;
    try {
      const response = await axiosInstance.get(`${apiUrl}/get-chats`, {
        params: { userId, recipientId, pageNumber: pageNumber.toString(), pageSize: pageSize.toString() }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching chats', error);
      return null;
    }
  };

  // Gửi tin nhắn
  const sendMessage = async (formData: FormData) => {
    try {
      const response = await axiosInstance.post(`${apiUrl}/send-message`, formData);
      return response.data;
    } catch (error) {
      console.error('Error sending message', error);
      return null;
    }
  };

  // Lấy thông tin người nhận
  const getRecipientInfo = async (userId: string, recipientId: string) => {
    try {
      const response = await axiosInstance.get<RecipientInfo>(`${apiUrl}/${userId}/recipient-info/${recipientId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching recipient info', error);
      return null;
    }
  };

  // Đánh dấu tin nhắn là đã đọc
  const markMessageAsRead = async (chatId: string) => {
    try {
      const response = await axiosInstance.post(`${apiUrl}/${chatId}/mark-as-read`, {});
      return response.data;
    } catch (error) {
      console.error('Error marking message as read', error);
      return null;
    }
  };

  // Xóa tất cả tin nhắn giữa người dùng và người nhận
  const deleteChat = async (userId: string, recipientId: string) => {
    try {
      const response = await axiosInstance.delete(`${apiUrl}/${userId}/delete-chats/${recipientId}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting chat', error);
      return null;
    }
  };

  // Thêm phản ứng vào tin nhắn
  const addReaction = async (chatId: string, reactionType: string) => {
    const body = { reactionType };
    try {
      const response = await axiosInstance.post(`${apiUrl}/${chatId}/react`, body);
      return response.data;
    } catch (error) {
      console.error('Error adding reaction', error);
      return null;
    }
  };

  // Xóa phản ứng từ tin nhắn
  const removeReaction = async (chatId: string) => {
    try {
      const response = await axiosInstance.delete(`${apiUrl}/${chatId}/remove-reaction`);
      return response.data;
    } catch (error) {
      console.error('Error removing reaction', error);
      return null;
    }
  };

  // Xóa tin nhắn
  const deleteMessage = async (chatId: string) => {
    try {
      const response = await axiosInstance.post(`${apiUrl}/${chatId}/delete-message`, {});
      return response.data;
    } catch (error) {
      console.error('Error deleting message', error);
      return null;
    }
  };

  // Ghim tin nhắn
  const pinMessage = async (chatId: string) => {
    try {
      const response = await axiosInstance.post(`${apiUrl}/${chatId}/pin`, {});
      return response.data;
    } catch (error) {
      console.error('Error pinning message', error);
      return null;
    }
  };

  // Bỏ ghim tin nhắn
  const unpinMessage = async (chatId: string) => {
    try {
      const response = await axiosInstance.post(`${apiUrl}/${chatId}/unpin`, {});
      return response.data;
    } catch (error) {
      console.error('Error unpinning message', error);
      return null;
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
