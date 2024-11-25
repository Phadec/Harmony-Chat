import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AppConfigService from './app-config.service';

class AuthService {
  apiUrl: string;
  constructor(appConfig: typeof AppConfigService) {
    this.apiUrl = `${appConfig.getBaseUrl()}/api/Auth`;
  }

  handelException(e:any) {
    if (e.response) {
      // Nếu lỗi từ phía server (mã phản hồi HTTP 4xx hoặc 5xx)
      console.log('Response error: ', e.response);
      console.log('Status code: ', e.response.status);
      console.log('Response data: ', e.response.data);
    } else if (e.request) {
      // Nếu lỗi không nhận được phản hồi từ server
      console.log('Request error: ', e.request);
    } else {
      // Lỗi khác (có thể là vấn đề trong quá trình setup axios)
      console.log('General error: ', e.message);
    }
  }

  // Retrieve token from AsyncStorage
  async getToken(): Promise<string | null> {
    return await AsyncStorage.getItem('token');
  }

  // Decode JWT token payload
  decodeToken(token: string): any | null {
    return JSON.parse(atob(token.split('.')[1]));
  }

  // Check if token is expired
  isTokenExpired(token: string): Boolean {
    const decoded = this.decodeToken(token);
    if (!decoded || !decoded.exp) {
      return true;
    }
    const expirationDate = new Date(decoded.exp * 1000);
    return expirationDate < new Date();
  }

  // Check if user is authenticated
  async isAuthenticated(): Promise<Boolean> {
    const token = await this.getToken();
    if (!token || this.isTokenExpired(token)) {
      await this.clearSession(); // Clear session if token expired or not found
      return false;
    }
    return true;
  }

  // Clear token and userId from AsyncStorage
  async clearSession(): Promise<void> {
    try {
      await AsyncStorage.removeItem('token');
      await AsyncStorage.removeItem('userId');
      // Navigate to login (adjust navigation method as per your app’s setup)
      // e.g., navigation.navigate('Login');
    } catch (e) {
      console.error('Failed to clear session:', e);
    }
  }

  // Register user
  async register(data: FormData) {
    return await axios.post(`${this.apiUrl}/register`, data, {headers: {'Content-Type': 'multipart/form-data'}});
  }

  // Confirm email
  async confirmEmail(token: string) {
    return await axios.get(`${this.apiUrl}/confirm-email`, { params: { token } });
  }

  // Login user
  async login(username: string, password: string) {
    const formData = new FormData();
    formData.append('Username', username);
    formData.append('Password', password);

    return await axios.post(`${this.apiUrl}/login`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
  }

  // Logout user
  async logout(userId: string) {
    const formData = new FormData();
    formData.append('userId', userId);

    return await axios.post(`${this.apiUrl}/logout`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
  }

  // Forgot password
  async forgotPassword(username: string) {
    const payload = { Username: username };

    return await axios.post(`${this.apiUrl}/forgot-password`, payload, { headers: { 'Content-Type': 'application/json' } });
  }

  // Reset password
  async resetPassword(data: FormData) {
    return await await axios.post(`${this.apiUrl}/reset-user-password`, data, { headers: { 'Content-Type': 'multipart/form-data' } });
  }

  // Change password
  async changePassword(currentPassword: string, newPassword: string) {
    const userId = await AsyncStorage.getItem('userId');

    if (!userId) {
      console.error('User ID not found in AsyncStorage.');
      throw new Error('User ID is missing.');
    }

    const payload = {
      userId: userId,
      currentPassword: currentPassword,
      newPassword: newPassword
    };

    return await axios.post(`${this.apiUrl}/change-user-password`, payload, {
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

export default new AuthService(AppConfigService);