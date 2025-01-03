import axiosInstance from "../axiosInstance";
// Get base URL from axiosInstance.js
import {baseURL} from '../axiosInstance';
import AsyncStorage from "@react-native-async-storage/async-storage";


const API_URL = baseURL + '/api/Groups';

export class GroupService {
	async createGroup(data) {
		console.log('URL:', `${API_URL}/create-group-chat`);
		try {
			const response = await axiosInstance.post(
				`${API_URL}/create-group-chat`, data,
				{
					headers: {
						'Content-Type': 'multipart/form-data',
					},
				});
			return response.data;
		} catch (error) {
			console.log('Error at createGroup:', error);
			return null;
		}
	}

	async getGroupDetails() {
		try {
			const userId = await AsyncStorage.getItem('userId');
			const response = await axiosInstance.get(
				`${API_URL}/user-groups-with-details/${userId}`);
			if (response) return response.data

			return null;
		} catch (error) {
			console.log('Error at getGroupDetails:', error);
			return null;
		}
	}

	async muteGroupNotification(groupId) {
		try {
			const response = await axiosInstance.post(
				`${API_URL}/${groupId}/mute-group-notifications`);

			if (response.status === 200) {
				return true;
			}

			return false;
		} catch (error) {
			console.log('Error at muteGroupNotification:', error);
			return false;
		}
	}

	// Xóa nhóm chat
	async deleteGroup(groupId) {
		try {
			const response = await axiosInstance.delete(
				`${API_URL}/${groupId}/delete`
			);
			if (response.status){
				return true;
			}
			console.error('Delete group chat failed:', response.data);
			return false;
		} catch (error) {
			console.error('Delete group chat failed:', error.response ? error.response.data : error.message);
			return false;
		}
	}
}
