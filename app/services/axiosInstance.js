import axios from 'axios';
import AsyncStorage from "@react-native-async-storage/async-storage";

// Create an axios instance
export const baseURL = 'http://192.168.1.30:5250';

const axiosInstance = axios.create({
    baseURL: baseURL,
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Thêm interceptor vào axios instance để tự động gửi Bearer Token
axiosInstance.interceptors.request.use(
    async (config) => {
        // Lấy token từ localStorage
        const token = await  AsyncStorage.getItem('token');
        // Nếu token tồn tại thì thêm Authorization vào header
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    }
);

// Thêm interceptor vào response
axiosInstance.interceptors.response.use(
    (response) => {
        return response;
    },
    (error) => {
        console.log('Error response:', error.response);
        return Promise.reject(error);
    }
);

export default axiosInstance;
