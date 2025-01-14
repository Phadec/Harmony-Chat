import axiosInstance from "../axiosInstance";
// Get base URL from axiosInstance.js
import { baseURL } from '../axiosInstance';
import AsyncStorage from "@react-native-async-storage/async-storage";

const API_URL = baseURL + '/api/Users';

export class UserService {
	async searchFriends(query) {
		try {
			const response = await axiosInstance.get(`${API_URL}/search`,
				{
					params: {
						tagName: query
					}
				});
			return response.data;
		} catch (error) {
			console.log('Error at searchFriends:', error);
			return null;
		}

	}

	async getUserInfo() {
		try {
			const userId = await AsyncStorage.getItem('userId');
			const response = await axiosInstance.get(`${API_URL}/${userId}/get-user-info`, {
				headers: {
					accept: '*/*',
				},
			});
			return response.data;
		} catch (error) {
			console.error('Error fetching user info:', error);
			throw error;
		}
	}

	async updateUserInfo(userInfo) {
		const userId = await AsyncStorage.getItem('userId');
		const formData = new FormData();
		formData.append('FirstName', userInfo.firstName);
		formData.append('LastName', userInfo.lastName);
		formData.append('Birthday', userInfo.birthday);
		formData.append('Email', userInfo.email);

		// Chỉ thêm AvatarFile nếu có
		if (userInfo.avatar) {
			formData.append('AvatarFile', {
				uri: userInfo.avatar,
				type: 'image/jpeg',
				name: 'avatar.jpg'
			});
		}
		console.log(userInfo.avatar);
		
		try {
			await axiosInstance.put(`${API_URL}/${userId}/update-user`, formData, {
				headers: {
					accept: '*/*',
					'Content-Type': 'multipart/form-data',
				},
			});
		} catch (error) {
			console.error('Error updating user info:', error.response ? error.response.data : error.message);
			throw error;
		}
	}
}
