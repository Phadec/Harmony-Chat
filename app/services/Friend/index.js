import axiosInstance from "../axiosInstance";
// Get base URL from axiosInstance.js
import {baseURL} from '../axiosInstance';
import AsyncStorage from "@react-native-async-storage/async-storage";

const API_URL = baseURL + '/api/Friends';

export class FriendService {
	async getFriends() {
		try {
			const userId = await AsyncStorage.getItem('userId');
			const response = await axiosInstance.get(`${API_URL}/${userId}/friends`);
			return response.data;
		} catch (error) {
			console.log('Error at getFriends:', error);
			return null;
		}
	}
}
