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

	async muteFriendNotification(friendId) {
		try {
			const userId = await AsyncStorage.getItem('userId');
			const response = await axiosInstance.post(`${API_URL}/${userId}/mute-friend-notifications/${friendId}`);

			if (response.status === 200) {
				return response.data;
			}

			return null;
		} catch (error) {
			console.log('Error at muteFriendNotification:', error);
			return null;
		}
	}

	async loadFriendRequests() {
		try {
			const userId = await AsyncStorage.getItem('userId');
			const response = await axiosInstance.get(`${API_URL}/${userId}/friend-requests`);

			if (response.status === 200) {
				return response.data;
			}
		} catch (error) {
			console.log('Error at loadFriendRequests:', error);
			return null;
		}
	}

	async unFriend(friendId) {
		try {
			const userId = await AsyncStorage.getItem('userId');
			const response = await axiosInstance.delete(`${API_URL}/${userId}/remove/${friendId}`);

			if (response.status === 200) {
				return true;
			}
			return false;
		} catch (error) {
			console.log('Error at unFriend:', error);
			return false;
		}
	}

	async acceptFriendRequest(requestId) {
		try {
			const userId = await AsyncStorage.getItem('userId');
			const response = await axiosInstance.post(`${API_URL}/${userId}/accept-friend-request/${requestId}`);

			if (response.status === 200) {
				return true;
			}
			return false;
		} catch (error) {
			console.log('Error at acceptFriendRequest:', error);
			return null;
		}
	}

}
