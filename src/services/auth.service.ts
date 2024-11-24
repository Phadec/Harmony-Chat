import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AppConfigService from './app-config.service';

class AuthService {
  apiUrl: string;
  constructor(appConfig: typeof AppConfigService) {
    this.apiUrl = `${appConfig.getBaseUrl()}/api/Auth`;
  }

  // Retrieve token from AsyncStorage
  async getToken() {
    try {
      return await AsyncStorage.getItem('token');
    } catch (e) {
      console.error('Failed to retrieve token:', e);
      return null;
    }
  }

  // Decode JWT token payload
  decodeToken(token: string) {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload;
    } catch (e) {
      console.error('Failed to decode token:', e);
      return null;
    }
  }

  // Check if token is expired
  isTokenExpired(token: string) {
    const decoded = this.decodeToken(token);
    if (!decoded || !decoded.exp) {
      return true;
    }
    const expirationDate = new Date(decoded.exp * 1000);
    return expirationDate < new Date();
  }

  // Check if user is authenticated
  async isAuthenticated() {
    const token = await this.getToken();
    if (!token || this.isTokenExpired(token)) {
      await this.clearSession(); // Clear session if token expired or not found
      return false;
    }
    return true;
  }

  // Clear token and userId from AsyncStorage
  async clearSession() {
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
    try {
      const response = await axios.post(`${this.apiUrl}/register`, data);
      return response.data;
    } catch (e) {
      console.error('Register error:', e);
      throw e;
    }
  }

  // Confirm email
  async confirmEmail(token: string) {
    try {
      const response = await axios.get(`${this.apiUrl}/confirm-email`, { params: { token } });
      return response.data;
    } catch (e) {
      console.error('Confirm email error:', e);
      throw e;
    }
  }

  // Login user
  async login(username: string, password: string) {
    const formData = new FormData();
    formData.append('Username', username);
    formData.append('Password', password);

    await axios.post('http://192.168.1.30:5250/api/Auth/login', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
      .then((data) =>
      console.log("Data>", data))
      .catch(e => {
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
    })
    // try {
    //   const response = await axios.post(`${this.apiUrl}/login`, formData);
    //   console.log(response.data);
    //   return response.data;
    // } catch (e) {
    //   console.error('Login error:', e);
    //   throw e;
    // }
  }

  // Logout user
  async logout(userId: string) {
    const formData = new FormData();
    formData.append('userId', userId);

    try {
      const response = await axios.post(`${this.apiUrl}/logout`, formData);
      return response.data;
    } catch (e) {
      console.error('Logout error:', e);
      throw e;
    }
  }

  // Forgot password
  async forgotPassword(username: string) {
    const payload = { Username: username };

    try {
      const response = await axios.post(`${this.apiUrl}/forgot-password`, payload, {
        headers: { 'Content-Type': 'application/json' }
      });
      return response.data;
    } catch (e) {
      console.error('Forgot password error:', e);
      throw e;
    }
  }

  // Reset password
  async resetPassword(data: FormData) {
    try {
      const response = await axios.post(`${this.apiUrl}/reset-user-password`, data);
      return response.data;
    } catch (e) {
      console.error('Reset password error:', e);
      throw e;
    }
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

    try {
      const response = await axios.post(`${this.apiUrl}/change-user-password`, payload, {
        headers: { 'Content-Type': 'application/json' }
      });
      return response.data;
    } catch (e) {
      console.error('Change password error:', e);
      throw e;
    }
  }
}

export default new AuthService(AppConfigService);