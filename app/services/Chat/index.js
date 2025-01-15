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
            const formData = new FormData();

            formData.append('UserId', userId ? userId.toString() : '');
            formData.append('RecipientId', recipientId ? recipientId.toString() : '');
            formData.append('Message', message || '');
            formData.append('RepliedToMessageId', RepliedToMessageId ? RepliedToMessageId.toString() : '');

            if (attachment) {
                console.log('Processing attachment:', attachment);
                
                // Ensure file name doesn't have spaces and special characters
                const safeFileName = (attachment.fileName || "attachment").replace(/[^a-z0-9.]/gi, '_');
                
                const file = {
                    uri: Platform.OS === 'android' ? attachment.uri : attachment.uri.replace('file://', ''),
                    type: attachment.type || 'application/octet-stream',
                    name: safeFileName
                };

                console.log('Adding file to FormData:', file);

                formData.append('Attachment', file); // Ensure the file is appended

                // Log FormData after
                console.log('FormData after attachment:', formData);
            }

            console.log('Sending request to:', `${ApiUrl}/send-message`);

            const response = await axiosInstance.post(
                `${ApiUrl}/send-message`, 
                formData,
                {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                        'Accept': 'application/json',
                    },
                    transformRequest: (data, headers) => {
                        // Don't transform FormData
                        return data;
                    },
                }
            );

            console.log('Server response:', {
                status: response.status,
                data: response.data
            });

            return response.data;
        } catch (error) {
            console.error('Send message error:', {
                message: error.message,
                responseData: error.response?.data,
                status: error.response?.status
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
	async deleteChat(userId, recipientId) {
		try {
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
