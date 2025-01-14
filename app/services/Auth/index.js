import axios from 'axios';

// Get base URL from axiosInstance.js
import {baseURL} from '../axiosInstance';
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

	async register(data) {
		console.log('URL register:', `${API_URL}/register`);

		const formData = new FormData();
		formData.append('Username', data.username);
		formData.append('Password', data.password);
		formData.append('RetypePassword', data.confirmPassword);
		formData.append('FirstName', data.firstName);
		formData.append('LastName', data.lastName);
		formData.append('Birthday', new Date(data.date).toISOString());
		formData.append('Email', data.email);
		formData.append('File', '');

		const response = await axios.post(`${API_URL}/register`, formData, {
			headers: {
				'Content-Type': 'multipart/form-data',
			},
			timeout: 10000,
		});
		return response;
	}

	async confirmEmail(token) {
		console.log('URL:', `${API_URL}/confirm-email`);
		return await axios.get(`${API_URL}/confirm-email?token=${token}`);
	}

	async resetPassword(username) {
		console.log('URL:', `${API_URL}/reset-password`);

		return await axios.post(`${API_URL}/reset-password`, JSON.stringify(username), {
			headers: {
				'Content-Type': 'application/json',
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
