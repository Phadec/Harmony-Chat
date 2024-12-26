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
}
