import axiosInstance, {baseURL} from "../axiosInstance";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from 'react-native';

const ApiUrl = `${baseURL}/api/Chats`;

export class ChatService {

	// Lấy các mối quan hệ (bạn bè, nhóm)
	async getRelationships() {
		const userId = await AsyncStorage.getItem('userId');
		try {
			const response = await axiosInstance.get(
				`${ApiUrl}/get-relationships`, {
					params: {userId: userId || ''},
				});

			if (response.data) {
				return response.data; // Trả về dữ liệu nhận được từ API
			}

			console.error('Get relationships failed:', response.data);
			return null;
		} catch (error) {
			console.error('Get relationships failed:', error.response ? error.response.data : error.message);
		}
	}

	// Lấy các tin nhắn giữa người dùng và người nhận
	async getChats(recipientId, pageNumber, pageSize) {
		const userId = await AsyncStorage.getItem('userId');
		try {
			const response = await axiosInstance.get(
				`${ApiUrl}/get-chats`, {
					params: {
						userId: userId || '',
						recipientId: recipientId || '',
						pageNumber: pageNumber,
						pageSize: pageSize,
					},
				});

			if (response.data) {
				return response.data; // Trả về dữ liệu nhận được từ API
			}

			console.error('Get chats failed:', response.data);
			return null;
		} catch (error) {
			console.error('Get chats failed:', error.response ? error.response.data : error.message);
		}
	}

	// Gửi tin nhắn
	async sendMessage(recipientId, message, attachment, RepliedToMessageId) {
        try {
            const userId = await AsyncStorage.getItem('userId');
            
            // Create request body as plain object first
            const requestData = {
                UserId: userId?.toString() || '',
                RecipientId: recipientId?.toString() || '',
                Message: message || '',
                RepliedToMessageId: RepliedToMessageId?.toString() || ''
            };

            // Log the request data
            console.log('Sending message request:', requestData);

            let formData = new FormData();
            
            // Append data to FormData
            Object.keys(requestData).forEach(key => {
                formData.append(key, requestData[key]);
            });

            // Add attachment if exists
            if (attachment) {
                const file = {
                    uri: Platform.OS === 'android' ? attachment.uri : attachment.uri.replace('file://', ''),
                    type: attachment.type || 'application/octet-stream',
                    name: attachment.fileName || 'attachment'
                };
                formData.append('Attachment', file);
            }

            // Make the request
            const response = await axiosInstance.post(
                `${ApiUrl}/send-message`, 
                formData,
                {
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'multipart/form-data'
                    }
                }
            );

            console.log('Server response:', response.data);
            return response.data;
        } catch (error) {
            console.error('Send message error:', {
                error: error.message,
                data: error.response?.data
            });
            throw error;
        }
    }

	// Đánh dấu tin nhắn là đã đọc
	async markMessageAsRead(chatId) {
		try {
			const response = await axiosInstance.post(
				`${ApiUrl}/${chatId}/mark-as-read`, {}
			);

			if (response.status === 200) {
				return true;
			}

			return false;
		} catch (error) {
			console.error('Mark message as read failed:', error.response ? error.response.data : error.message);
		}
	}

	// Xóa tin nhắn
	async deleteMessage(chatId) {
		try {
			const response = await axiosInstance.post(
				`${ApiUrl}/${chatId}/delete-message`, {}
			);

			if (response.data) {
				return response.data; // Trả về dữ liệu nhận được từ API
			}

			console.error('Delete message failed:', response.data);
			return null;
		} catch (error) {
			console.error('Delete message failed:', error.response ? error.response.data : error.message);
		}
	}

	// Xóa tất cả tin nhắn giữa người dùng và người nhận
	async deleteChat(recipientId) {
		try {
			const userId = await AsyncStorage.getItem('userId');
			const response = await axiosInstance.delete(
				`${ApiUrl}/${userId}/delete-chats/${recipientId}`
			);

			if (response.data) {
				return response.data; // Trả về dữ liệu nhận được từ API
			}

			console.error('Delete chat failed:', response.data);
			return null;
		} catch (error) {
			console.error('Delete chat failed:', error.response ? error.response.data : error.message);
		}
	}

	// Thêm phản ứng vào tin nhắn
	async addReaction(chatId, reactionType) {
		const body = {reactionType};

		try {
			const response = await axiosInstance.post(
				`${ApiUrl}/${chatId}/react`, body
			);

			if (response.data) {
				return response.data; // Trả về dữ liệu nhận được từ API
			}

			console.error('Add reaction failed:', response.data);
			return null;
		} catch (error) {
			console.error('Add reaction failed:', error.response ? error.response.data : error.message);
		}
	}

	// Xóa phản ứng từ tin nhắn
	async removeReaction(chatId) {
		try {
			const response = await axiosInstance.delete(
				`${ApiUrl}/${chatId}/remove-reaction`
			);

			if (response.data) {
				return response.data; // Trả về dữ liệu nhận được từ API
			}

			console.error('Remove reaction failed:', response.data);
			return null;
		} catch (error) {
			console.error('Remove reaction failed:', error.response ? error.response.data : error.message);
		}
	}

	// Ghim tin nhắn
	async pinMessage(chatId) {
		try {
			const response = await axiosInstance.post(
				`${ApiUrl}/${chatId}/pin`, {}
			);

			if (response.data) {
				return response.data; // Trả về dữ liệu nhận được từ API
			}

			console.error('Pin message failed:', response.data);
			return null;
		} catch (error) {
			console.error('Pin message failed:', error.response ? error.response.data : error.message);
		}
	}

	// Bỏ ghim tin nhắn
	async unpinMessage(chatId) {
		try {
			const response = await axiosInstance.post(
				`${ApiUrl}/${chatId}/unpin`, {}
			);

			if (response.data) {
				return response.data; // Trả về dữ liệu nhận được từ API
			}

			console.error('Unpin message failed:', response.data);
			return null;
		} catch (error) {
			console.error('Unpin message failed:', error.response ? error.response.data : error.message);
		}
	}
}
