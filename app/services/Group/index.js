import axiosInstance from "../axiosInstance";
// Get base URL from axiosInstance.js
import {baseURL} from '../axiosInstance';


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
}
