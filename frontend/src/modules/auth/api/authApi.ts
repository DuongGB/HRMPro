import api from "../../../config/api";
import type { LoginRequest, LoginResponse, RefreshTokenResponse, ChangePasswordRequest } from "../types";

export const authApi = {
  login: async (data: LoginRequest): Promise<LoginResponse> => {
    // api đã được cấu hình interceptor trả về response.data (phần data của axios)
    // trong api.ts: return response.data;
    // Do đó, response trả về từ interceptor là ApiResponse<LoginResponse>
    // Hãy ép kiểu và trích xuất dữ liệu data
    const response = (await api.post("/auth/login", data)) as any;
    return response.data;
  },

  refresh: async (refreshToken: string): Promise<RefreshTokenResponse> => {
    const response = (await api.post("/auth/refresh", { refreshToken })) as any;
    return response.data;
  },

  logout: async (refreshToken: string): Promise<void> => {
    await api.post("/auth/logout", { refreshToken });
  },

  changePassword: async (data: ChangePasswordRequest): Promise<void> => {
    await api.post("/auth/change-password", data);
  },
};
