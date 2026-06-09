import axios from "axios";
import { store } from "../store";
import { logout, updateAccessToken } from "../store/slices/authSlice";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api/v1",
  headers: {
    "Content-Type": "application/json",
  },
});

// Request Interceptor: Đính kèm Access Token vào Header
api.interceptors.request.use(
  (config) => {
    const state = store.getState();
    const token = state.auth.accessToken;
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

let isRefreshing = false;
let failedQueue: any[] = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Response Interceptor: Tự động xử lý Refresh Token khi gặp lỗi 401 (Unauthorized)
api.interceptors.response.use(
  (response) => {
    return response.data; // Trả về trực tiếp phần body (ApiResponse)
  },
  async (error) => {
    const originalRequest = error.config;

    // Tránh vòng lặp vô hạn và chỉ xử lý khi là lỗi 401
    if (error.response?.status === 401 && !originalRequest._retry) {
      // Nếu là API đăng nhập bị lỗi 401 thì báo lỗi ngay
      if (originalRequest.url?.includes("/auth/login") || originalRequest.url?.includes("/auth/refresh")) {
        return Promise.reject(error);
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const state = store.getState();
      const refreshToken = state.auth.refreshToken;

      if (!refreshToken) {
        store.dispatch(logout());
        return Promise.reject(error);
      }

      try {
        // Gọi API refresh token
        const res = await axios.post(`${api.defaults.baseURL}/auth/refresh`, {
          refreshToken,
        });

        // Response format của /auth/refresh: { success: true, data: { accessToken, ... } } hoặc theo wrapper ApiResponse
        // Do dùng axios trực tiếp nên cần kiểm tra cấu trúc dữ liệu trả về
        const apiResponse = res.data;
        const newAccessToken = apiResponse.data.accessToken;

        // Cập nhật token mới vào Redux Store
        store.dispatch(updateAccessToken(newAccessToken));

        // Tiếp tục chạy các request bị nghẽn
        processQueue(null, newAccessToken);
        isRefreshing = false;

        // Gọi lại request ban đầu với token mới
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        isRefreshing = false;
        // Nếu refresh token thất bại → Đăng xuất
        store.dispatch(logout());
        return Promise.reject(refreshError);
      }
    }

    // Trích xuất thông tin lỗi từ response của Spring Boot (ApiResponse)
    const apiError = error.response?.data;
    if (apiError && apiError.message) {
      return Promise.reject(new Error(apiError.message));
    }

    return Promise.reject(error);
  }
);

export default api;
