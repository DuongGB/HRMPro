import api from "../../../config/api";

export interface UserResponse {
  id: number;
  username: string;
  employeeId: number | null;
  employeeCode: string | null;
  employeeName: string | null;
  isActive: boolean;
  roles: string[];
  createdAt: string;
}

export interface UserCreateRequest {
  username: string;
  password?: string;
  employeeId?: number | null;
  roles: string[];
}

export interface PageResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export const userApi = {
  getUsers: async (
    page = 0,
    size = 10,
    sortBy = "id",
    direction = "asc"
  ): Promise<PageResponse<UserResponse>> => {
    const response = (await api.get("/users", {
      params: { page, size, sortBy, direction },
    })) as any;
    return response.data;
  },

  createUser: async (data: UserCreateRequest): Promise<UserResponse> => {
    const response = (await api.post("/users", data)) as any;
    return response.data;
  },

  toggleStatus: async (id: number, isActive: boolean): Promise<UserResponse> => {
    const response = (await api.put(`/users/${id}/status`, null, {
      params: { isActive },
    })) as any;
    return response.data;
  },

  resetPassword: async (id: number, newPassword: string): Promise<void> => {
    await api.post(`/users/${id}/reset-password`, { newPassword });
  },

  updateRoles: async (id: number, roles: string[]): Promise<UserResponse> => {
    const response = (await api.put(`/users/${id}/roles`, { roles })) as any;
    return response.data;
  },

  // Mock hoặc tải danh sách nhân viên chưa có tài khoản để phục vụ liên kết
  getAvailableEmployees: async (): Promise<{ id: number; employeeCode: string; fullName: string }[]> => {
    try {
      const response = (await api.get("/employees", { params: { size: 100 } })) as any;
      // Do module employee chưa phát triển đầy đủ ở Phase 2, chúng ta bọc try-catch
      // Nếu lỗi (404/500 do chưa có api), trả về mảng rỗng
      return response.data?.content?.map((emp: any) => ({
        id: emp.id,
        employeeCode: emp.employeeCode,
        fullName: `${emp.lastName} ${emp.firstName}`,
      })) || [];
    } catch (e) {
      return [];
    }
  }
};
