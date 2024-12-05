import axios from 'axios';
import AppConfigService from './src/services/app-config.service'; // Import AppConfigService

// Hàm lấy Bearer Token từ localStorage
const getToken = () => {
    return localStorage.getItem('token'); // Giả sử token lưu trong localStorage
};

// Tạo instance của axios với các cấu hình mặc định
const axiosInstance = axios.create({
    baseURL: AppConfigService.getBaseUrl(), // Lấy baseURL từ AppConfigService
    timeout: 10000, // Đặt timeout cho yêu cầu
});

// Thêm interceptor vào axios instance để tự động gửi Bearer Token
axiosInstance.interceptors.request.use(
    (config) => {
        const token = getToken(); // Lấy token từ localStorage
        if (token) {
            // Thêm Bearer Token vào header của yêu cầu
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        return config; // Trả về cấu hình đã chỉnh sửa
    },
    (error) => {
        return Promise.reject(error); // Nếu có lỗi trong interceptor, trả về lỗi
    }
);

// Bạn có thể thêm interceptor cho response nếu cần
axiosInstance.interceptors.response.use(
    (response) => {
        return response; // Nếu phản hồi thành công, trả về response
    },
    (error) => {
        return Promise.reject(error); // Nếu có lỗi trong phản hồi, trả về lỗi
    }
);

export default axiosInstance;
