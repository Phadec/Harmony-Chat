import axiosInstance from "../axiosInstance";
// Get base URL from axiosInstance.js
import {baseURL} from '../axiosInstance';
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
}
