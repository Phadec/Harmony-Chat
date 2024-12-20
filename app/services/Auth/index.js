import axios from 'axios';

// Get base URL from axiosInstance.js
import { baseURL } from '../axiosInstance';
import AsyncStorage from "@react-native-async-storage/async-storage";

const API_URL = baseURL + '/api/Auth';

export class AuthService {

	async login(username, password) {
		console.log('URL:', `${API_URL}/login`);

		const data = new FormData();
		data.append('username', username);
		data.append('password', password);

		// Gửi dữ liệu dưới dạng JSON
		return await axios.post(`${API_URL}/login`, data, {
			headers: {
				'Content-Type': 'multipart/form-data',
			},
		});
	}

	async getTokens() {
		return await AsyncStorage.getItem('token');
	}

	// Decode JWT token payload
	decodeToken(token) {
		return JSON.parse(atob(token.split('.')[1]));
	}

	// Check if token is expired
	isTokenExpired(token) {
		const decoded = this.decodeToken(token);
		if (!decoded || !decoded.exp) {
			return true;
		}
		const expirationDate = new Date(decoded.exp * 1000);
		return expirationDate < new Date();
	}

	// Check if user is authenticated
	async isAuthenticated() {
		const token = await this.getTokens();
		if (!token || this.isTokenExpired(token)) {
			// clear storage
			await AsyncStorage.clear();
			return false;
		}
		return true;
	}
}
