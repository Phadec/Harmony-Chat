import axiosInstance, {baseURL} from "../axiosInstance";
import AsyncStorage from "@react-native-async-storage/async-storage";

const ApiUrl = `${baseURL}/api/Chats`;

export class ChatService {

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

			console.error('Get message failed:', response.data);
			return null;
		} catch (error) {
			console.error('Get message failed:', error.response ? error.response.data : error.message);
		}
	};

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

			console.error('Get message failed:', response.data);
			return null;
		} catch (error) {
			console.error('Get message failed:', error.response ? error.response.data : error.message);
		}
	}

	async sendMessage(recipientId, message, attachment, repliedToMessageId) {
		const userId = await AsyncStorage.getItem('userId');
		const formData = new FormData();
		formData.append('UserId', userId || '');
		formData.append('RecipientId', recipientId || '');
		formData.append('Message', message || '');

		try {
			const response = await axiosInstance.post(
				`${ApiUrl}/send-message`, formData,
				{
					headers: {
						'Content-Type': 'multipart/form-data',
					},
				});

			if (response.data) {
				return response.data; // Trả về dữ liệu nhận được từ API
			}

			console.error('Get message failed:', response.data);
			return null;
		} catch (error) {
			console.error('Get message failed:', error.response ? error.response.data : error.message);
		}
	}

	async markAsRead(messageId) {

	}
}
